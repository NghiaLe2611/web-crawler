# def predict():
#     # return "hahaha"
#     return [1, 2, 3, 4, 5, 6, 100] 

# print(predict())

import sys
import json

def largest(arr, n):
 
    # Initialize maximum element
    max = arr[0]
 
    # Traverse array elements from second
    # and compare every element with
    # current max
    for i in range(1, n):
        if arr[i] > max:
            max = arr[i]
    return max
 
 
# Get data sent from Node.js script
data = json.loads(sys.argv[1])
result = largest(data, len(data))

# Process the data (replace with your actual logic)
# response_data = f"Received data from Node.js: {data['message']}. This is from python script."

# Print the response data to standard output
# print(456, response_data)
print("Largest in array: ", result)

