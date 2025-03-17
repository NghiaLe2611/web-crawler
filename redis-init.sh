#!/bin/sh

# Kiểm tra xem Redis có đang chạy không
if pgrep redis-server > /dev/null; then
    echo "Redis is already running, skipping initialization."
    exit 0
fi

# Chạy Redis server với cấu hình ACL
redis-server --requirepass "${REDIS_PASSWORD}" &

# Chờ Redis khởi động
sleep 3

# Thiết lập ACL user (chỉ chạy 1 lần)
redis-cli -a "${REDIS_PASSWORD}" ACL SETUSER "${REDIS_USERNAME}" on ">${REDIS_PASSWORD}" ~* +@all

# Chạy Redis ở foreground để container không bị tắt
wait
