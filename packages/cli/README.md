#  Cloud Optimized Tar (COTAR) - CLI (@cotar/cli)

.tar + .tar.index + AWS S3 = :heart:


## Create cloud optimized 

```bash
cotar create sample.tar --verbose --binary
```


### Load a tar + index 
```bash
cotar info sample.tar
```


### Seve a cotar from a webserver

```bash
cotar serve sample.tar
```

List all files inside the tar
```
curl http://localhost:8080/v1/list
```

Fetch a specific file from the tar
```
curl http://localhost:8080/v1/file/package.json
```