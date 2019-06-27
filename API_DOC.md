# API Documentation
This is the documentation for the backend system and it's API routes.

# Table Of Contents
* Routes requiring tokens
* Objects
    * All Objects
    * Find Object By Type
    * Get Created Objects
    * Get Specific Object from Id
    * Delete Object By Id
    * Create New Object
    * Update Object By Id
* Projects
    * Get All Projects
    * Get Project By Id
    * Create New Project
    * Delete Project By Id
    * Update Project Info
    * Update Project Data
* Users
    * Signup
    * Login
    * Change password
    * Request password reset
    * Password Reset
    * Fetch all users
    * Verify a user token
* Admin
    * User
    * Create account

## Routes requiring tokens
Some routes requires the user to be authenticated. This can be done by logging in
and aquiring a token. that token should then be sent with each request that needs it
as a query parameter after the url as such: `?token=YOURTOKENHERE`.

## Objects
The objects are reachable under the `/obj/` route.

### All Objects
Fetch all items with a `GET` Request to the route:
```
/obj/all
```
### All Local Objects For Project
Fetch both global and local items for a specific project with a `GET` Request to the route:
```
/obj/all/local/<YourProjectIdHere>
```
Where <YourProjectIdHere> is your projectID.

### Find Object By Type
Fetch items of a specific category based on the `Kategori` field in the database with a `GET` Request on the route:
```
/obj/type/<YourTypeHere>
```
where `<YourTypeHere>` is the type you want to find items for.

### Get Created Objects
Fetch items a user has created with a `GET` Request on the route:
```
/obj/created
```
Where `<YourUserIdHere>` is your userId.

### Get Specific Object from Id
Fetch a specific item by id with a `GET` Request on the route:
```
/obj/id/<YourObjectIdHere>
```
Where `<YourObjectIdHere>` is the id of a object.

### Delete Object By Id
Delete a object by id with a `POST` Request on the route:
```
/obj/delete/<YourObjectIdHere>
```
Where `<YourObjectIdHere>` is the id of a object.

### Create New Object
Create a new object with a `POST` Request with a `JSON` object with any values to the route:
```
/obj/insert/
```
The `JSON` object requires the values `Kategori` and `Modell`.

### Update Object By Id
 Update a object with a `POST` Request with a `JSON` object with any values to the route:
```
/obj/update/<YourObjectIdHere>
```
Where `<YourObjectIdHere>` is the id of a object.

### Disable Object By Id
Disable object with a `POST` Request with a `JSON` object with `isDisabled` assigned to `1` or `0` as values to the route:
```
/obj/disable/<YourObjectIdHere>
```
Where `<YourObjectIdHere>` is the id of a object.

### Send Make Object Global Request
Send a request to an admin about making a object global.
This is done with a `POST` Request with your object id and a 1 or a 0 as the second parameter to request / withdraw request:
```
/obj/approve/<YourObjectIdHere>/<1or0>
```
Where `<YourObjectIdHere>` is the id of a object.

### List All Object Categories
 Fetch all available categories with a `GET` Request to the route:
```
/obj/categories
```
### Get Icon For Category
Fetch icon for category with a `GET` Request to the route:
```
/obj/categories/icon/type/<InsertCategoryHere>
```
Where `InsertCategoryHere` is the category you want to search for.
### Get Icons For All Categories
Fetch icon for all categories with a `GET` Request to the route:
```
/obj/categories/icon/all
```

### Create New Icon For Category
Insert new icon for category with a `POST` Request with a `JSON` object with `Kategori` and `imgData` as values to the route:
```
/obj/categories/icon/insert
```

## Projects
The projects are reachable under the `/proj/` route.

### Get All Projects
Fetch all projects with a `GET` Request to the route:
```
/proj/all
```

### Get Project By Id
Fetch a specific project with a `GET` Request to the route:
```
/proj/id/<ProjectIdHere>
```
Where `<ProjectIdHere>` is the projectId.

### Get Project Data By Id
Fetch object `data` for the map from project with a `GET` Request to the route:
```
/proj/data/<ProjectIdHere>/
```
Where `<ProjectIdHere>` is the projectId.

### Get Project Info By Id
Fetch basic project infromation from a project with a `GET` Request to the route:
```
/proj/info/<ProjectIdHere>
```
Where `<ProjectIdHere>` is the projectId.

### Create New Project
Insert new project with a `POST` Request with `name`, `version`, `access` and `default` as values to the route:
```
/proj/insert
```
The `access` value is an Array with a number of JSON objects in it. The JSON object should have `userID` and `permission` as values.
The `default` value is a JSON object and can have any values.


### Delete Project By Id
Delete a project with a `POST` Request to the route:
```
/proj/delete/<ProjectIdHere>
```
Where `<ProjectIdHere>` is the projectId.


### Update Project Info
Update basic project infromation with a `POST` Request with `name` and `version` as values to the route:
```
/proj/update/info/<ProjectIdHere>
```
Where `<ProjectIdHere>` is the projectId.

### Update Project Data
Update/Save object data for the map with a `POST` Request with an `Array` to the route:
```
/proj/update/data/<ProjectIdHere>
```
Where `<ProjectIdHere>` is the projectId.

### Get User Access For Project
Fetch the permissions for a user from a project with a `GET` Request to the route:
```
/proj/permission/<ProjectIdHere>
```
Where `<ProjectIdHere>` is the projectId.

## Users
User routes can be found under the `/acc/` route.

### Signup
This route is temporary and should be dissabled once the system is ready to deploy. System should not
allow open signup. To signup send a `POST`request to `/acc/signup`. Submit a html-form
with the parameters `username`, `password` and `isAdmin`

### Login
Allows the user to login and returns a token for the client to use as authentication.
Send a `POST` request to `/acc/login` with the form fields `username` and `password`.

### Change password
Allows the user to change the password by sending a `POST` request to `/acc/changepassword`
with the form data `username`, `password`, `newPassword` and `confirmNewPassword`.

### Request password reset
The user can use this to reset a forgotten password. Sends a reset token to the users
email. Send a `POST` request to `/acc/requestreset` with the form data of `username`

### Password reset
With the one time reset token from the requestreset route the user can set a new password.
Send a `POST` request to `/acc/passwordreset` with the form data for `username`, `oneTimeKey`,
`newPassword` and `confirmNewPassword`

### Fetch all users
Fetching all users ID and username is done by sending a `GET` request to `/user/all` while logged in with a token.
Admin access is not required.

### Verify a user token
Verify that the user is logged in by sending a `GET` request to `/user/verify` while logged in with a token.

## Admin
This handles all the admin routes and cannot be used by non-admins. All routes are
available over at `/admin/`

### User
This routes shows basic info about the user making the request. Made to test if
user is an admin. Access this by sending a `GET` request to `/admin/user`.

### Create account
When a new account is needed for a user an admin can create one. A logged in admin
can send a `POST` requset with the form data `username` containing the new users **email** and
`isAdmin` if the new user should be admin.

### Remove account by id
Remove user by sending a `POST` Request to the following route:
```
/admin/remove/user/<UserToDeleteHere>
```
Where `<UserToDeleteHere>` is the user to delete.

### Get All Projects
Get all project by sending a `GET` Request to the following route:
```
/admin/allprojects
```

### Get All Global Objects
Get all global objects by sending a `GET` Request to the following route:
```
/admin/obj/all
```

### Get All Objects Requesting Review
Get all objects requesting review by sending a `GET` Request to the following route:
```
/admin/obj/approve
```

### Approve Object Request
Respond to a object requesting review by sending a `POST` Request containing the object id and a 1 or a 0 to approve / deny as the second parameter.
```
/admin/obj/approve/<YourObjectIdHere>/<1or0>
```
Where `<YourObjectIdHere>` is your object id

### Disable Global Object
Disable Global Objects by sending a `POST` Request to the following route:
```
/admin/obj/disable/<YourObjectIdHere>/<isEnabledHere>
```
Where <YourObjectIdHere> is your object id.
And `<isEnabledHere>` is the flag to set if the object should be global or not (only "1" and "0").

### Delete Global Object
Delete any object by sending a `POST` Request to the following route:
```
/admin/obj/delete/<YourObjectIdHere>
```
Where `<YourObjectIdHere>` is your object id.
