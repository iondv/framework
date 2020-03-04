FROM node:8
RUN npm install -g bower gulp mocha pm2
ADD ./platform /var/www
ARG ionpassword
ARG userpassword 
ARG CI_PROJECT_NAME
ARG CI_COMMIT_REF_SLUG
RUN cd /var/www && \
    npm install -g bower gulp  mocha pm2 && \
    yarn install && \
    export NODE_PATH=`pwd` && \
    gulp build
RUN bash /var/www/compile.sh 
ENV NODE_PATH "/var/www"
ENV CI_COMMIT_REF_SLUG $CI_COMMIT_REF_SLUG
EXPOSE 8888
