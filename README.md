# Introduction

Dramaking backend api is usiing following
- express js 
- mongo db
- typescript
- babel



# Installation

Make sure nodejs is installed on your system


## Pre installation

Install follwoing on your system

- mongo db [installation guide](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-18-04)
- redis  [installation guide](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04)
- install nginx server,  setup nginx server block and install Letsencrypt SSL 
- nodejs
- yarn 
- git
- install pm2 using npm install -g pm2




1. clone source code
2. install packages using `yarn` or `npm install`
3. copy [.env.example](.env.example) to [.env](.env) using following command

```bash
yarn copy  
# or
npm copy
```
3. start server in development mode using `yarn dev`  or `npm dev`
4. start server in production mode using `yarn start`  or `npm start`
5. for pm2 production start `pm2 start npm --name "app name" -- start`






# Sample Response

```json
{
    "status": 200,
    "message": "success",
    "data": {
        "message": "test message"
    }
}
```

```json
{
    "status": 400,
    "message": "error",
    "data": {
        "message": "There was some problem"
    }
}
```



#  How to make api call

You need to pass a token either as Bearer Token in header or token as query.



# Endpoints



# Oauth

in oauth you will get response like this

```json
{
"provider": "instagram",
"success": "true",
"token": "token"
}

```

or

```json
{
"provider": "instagram",
"error": "true",
"reason": "error message"
}

```


# Api doc

Api doc is available at [here](https://documenter.getpostman.com/view/12298360/T1LHHAGn)


| endpoint | query     | description                |
|----------|-----------|----------------------------|
| /        | liked     | liked video                |
| /        | shared    | shared video               |
| /        | viewed    | viewed video               |
| /        | uploaded  | uploaded video             |
| /        | following | video of Users I am following       |
| /        | followers | video of users who are following me |


