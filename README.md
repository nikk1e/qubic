# Qubic.io
Qube website

## Windows

### Prerequisite
* Install MongoDB ~3.0.4

* create an empty directory "..\qube\db"

```dos
mongod.exe --dbpath c:\MongoDB\qube\db --logpath c:\MongoDB\Logs\qube.txt --install
net start MongoDB
```

### Install

```dos
git clone ssh://git@qubic.io/var/repo/qubic.git
cd qubic
npm install
npm run-script install-windows-service
net start qubic
```    

### Debug

```dos
npm run dev-win
```

## TODO
Use cached if not logged in. Cache if not logged in.
    http://www.djm.org.uk/wordpress-nginx-reverse-proxy-caching-setup/

## Collections

play
user_<username>
public_<collection_name>
private_<collection_name>
