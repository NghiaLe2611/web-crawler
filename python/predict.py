from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        "message": "Hello from Python!"
    })
    
@app.route('/user')
def user():
    return jsonify({
        "message": "This is user route"
    })

if __name__ == '__main__':
    app.run(port=5001)
