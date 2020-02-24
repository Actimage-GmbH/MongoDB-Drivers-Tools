mv /var/log/nginx/access.log /var/log/nginx/access.log.bk
touch /var/log/nginx/access.log
service fail2ban restart
service nginx restart
tail -f /var/log/nginx/access.log