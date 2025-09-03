FROM redis:7-alpine

# Copy file config vào container
COPY redis.conf /usr/local/etc/redis/redis.conf

EXPOSE 6379

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
