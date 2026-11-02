FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html cadastro.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY imgs /usr/share/nginx/html/imgs
COPY pages /usr/share/nginx/html/pages

EXPOSE 80
