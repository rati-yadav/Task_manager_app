from app import create_app

app = create_app()

if __name__ == "__main__":
    # Development server — use gunicorn in production
    app.run(debug=True, port=5000)
