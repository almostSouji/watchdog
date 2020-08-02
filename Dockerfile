FROM node:12-alpine
LABEL name="Cerberus [bot]"
LABEL version="0.0.1"
LABEL maintainer="almostSouji"
ENV TOKEN= \
	OWNER=\
	PREFIX=\
	QUIZ_URL=\
	QUIZ_POST=\
	QUIZ_SECRET=\
	QUIZ_GUILD=\
	QUIZ_ROLE=\
	QUIZ_ENABLED=\
	FORCE_COLOR=1
WORKDIR /usr/cerberus
COPY package.json ./
RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& npm i \
&& apk del .build-deps
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]
