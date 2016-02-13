[![Build Status](https://travis-ci.org/QuantumConcepts/slumber-db.svg?branch=master)](https://travis-ci.org/QuantumConcepts/slumber-db)

# slumberDb
A No-SQL RESTful database engine written in JavaScript.

## Quick Start
Create a new folder and enter it via the command line and do the following:

    npm install slumber-db
    
    node
    > const SlumberDb = require("slumber-db");
    > const config = new SlumberDb.Config(8080, "./data");
    > const dbProcessor = new SlumberDb.DbProcessor(config);
    > const server = new SlumberDb.HttpServer(config, dbProcessor);
    > server.run();

A slumberDb server is now running on the default port (8080). Now you may...

`POST` to the following URL to create a new entity.
> http://localhost:8080/{database_name}/{entity_name}
	
`PUT` to the following URL to update an entity.
> http://localhost:8080/{database_name}/{entity_name}/{entity_id}
	
`GET` from the following URL to get all entities.
> http://localhost:8080/{database_name}/{entity_name}
	
`GET` from the following URL to get all entities matching the query.
> http://localhost:8080/{database_name}/{entity_name}?{field_name}.equals={some_value}
	
`DELETE` to the following URL to delete an entity.
> http://localhost:8080/{database_name}/{entity_name}/{entity_id}

##Security
There isn't any, yet. If you `POST` to a new `database_name` or `entity_name`, that database and/or entity path will be created for you.
