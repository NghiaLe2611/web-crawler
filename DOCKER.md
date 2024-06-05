1. Build
    docker build -t web-crawler .
2. Run
    docker run -p8080:5000 web-crawler
    docker run --env-file ./.env.production -p8080:5000 web-crawler (run with environment)


