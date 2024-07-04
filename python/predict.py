import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.python.layers import Sequential
from tensorflow.python.keras import LSTM, Dense, Dropout

def train_model(lottery_history, optimizer='adam', loss='mean_squared_error', epochs=100, max_number=49):
    number_of_rows = len(lottery_history)
    window_length = 2
    number_of_features = 7

    # Normalize the data to the range [0, 1]
    scaled_lottery_history = [[num / max_number for num in row] for row in lottery_history]

    # Prepare train and label data
    train = []
    label = []

    for i in range(number_of_rows - window_length):
        window = scaled_lottery_history[i:i + window_length]
        train.append(window)
        label.append(scaled_lottery_history[i + window_length])

    train_tensor = np.array(train)
    label_tensor = np.array(label)

    # Create the LSTM model
    model = Sequential([
        LSTM(50, input_shape=(window_length, number_of_features), return_sequences=True),
        Dropout(0.2),
        LSTM(50),
        Dropout(0.2),
        Dense(number_of_features)
    ])

    model.compile(optimizer=optimizer, loss=loss, metrics=['accuracy'])

    # Train the model
    history = model.fit(train_tensor, label_tensor, epochs=epochs, shuffle=True, verbose=0)

    return model, history

def predict(model, to_predict, max_number=49):
    scaled_to_predict = [[num / max_number for num in row] for row in to_predict]
    prediction_tensor = np.array([scaled_to_predict])
    scaled_prediction_output = model.predict(prediction_tensor)
    prediction_output = scaled_prediction_output[0]

    # Reverse the scaling
    inverse_scaled_prediction_output = [round(value * max_number) for value in prediction_output]
    return inverse_scaled_prediction_output

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    lottery_history = input_data['lottery_history']
    to_predict = input_data['to_predict']
    optimizer = input_data.get('optimizer', 'adam')
    max_number = input_data.get('max_number', 55)

    model, history = train_model(lottery_history, optimizer=optimizer, max_number=max_number)
    result = predict(model, to_predict, max_number=max_number)
    
    print(json.dumps({
        'prediction': result,
        'final_loss': history.history['loss'][-1],
        'final_accuracy': history.history['accuracy'][-1]
    }))