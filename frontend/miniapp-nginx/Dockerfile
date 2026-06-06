FROM nginx:alpine

RUN apk add --no-cache curl

COPY public/miniapp/ /usr/share/nginx/html/miniapp/
COPY miniapp-nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/miniapp/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
