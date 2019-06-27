#!/bin/bash

echo 'Name for admin:'
read name
echo 'Password:'
read -s pass

admin="db.createUser(
   {
     user: '$name',
     pwd: '$pass',
     roles: [ { role: 'userAdminAnyDatabase', db: 'admin' } ]
  }
)"

echo 'Name for user:'
read name
echo 'Password:'
read -s pass
echo 'Which database:'
read database

user="db.createUser(
   {
     user: '$name',
     pwd: '$pass',
     roles: [ { role: 'readWrite', db: '$database' } ]
  }
)"

login="use $database \n load('createCollections.js')\nload('insertObjects.js')\n $user \n use admin \n $admin \n exit"

echo -e "$login" | mongo

sudo cp ../config/mongodb.conf /etc/mongodb.conf
sudo service mongodb restart

echo "Database setup complete if the above didn't return an error."
echo "Starting nodejs config..."
printf "Database url (default is localhost): "
read dburl

if [ $dburl -z ]; then
    dburl="localhost"
fi

cat ../config/dbConfig.example.js |
sed -e "s/localhost/$dburl/g" |
sed -e "s/YourDatabase/$database/g" |
sed -e "s/EnterDbUsernameHere/$name/g"  |
sed -e "s/EnterDbPasswordHere/$pass/g" > ../config/dbConfig.js
