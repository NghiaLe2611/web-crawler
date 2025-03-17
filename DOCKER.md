1. Build
    docker build -t web-crawler .
2. Run
    docker run -p8080:5000 web-crawler
    docker run --env-file ./.env.production -p8080:5000 web-crawler (run with environment)

docker exec -it redis env
docker exec -it redis redis-cli 
ACL SETUSER admin on >26111994 ~* +@all