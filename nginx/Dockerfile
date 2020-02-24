FROM nginx:latest

RUN apt-get update
RUN apt-get install fail2ban -y

COPY ./jail.local /etc/fail2ban/jail.local
COPY ./nginx-ipban.conf /etc/fail2ban/action.d/nginx-ipban.conf
COPY ./nginx-http-auth.conf /etc/fail2ban/filter.d/nginx-http-auth.conf

RUN mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bk
RUN touch /etc/nginx/ipban.conf

VOLUME [ "/etc/sslcerts","/etc/nginx/conf.d","/etc/nginx/nginx.conf","/var/www/portal","/var/www/tc649e","/var/www/errors" ]

EXPOSE 443 80

CMD  service fail2ban restart && service nginx restart && tail -f /var/log/nginx/access.log