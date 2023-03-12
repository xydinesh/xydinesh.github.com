# Cloud Configuration Application

We have used cloud configuration application as a part of our end-to-end testing.
It is fully configured to work with tugboat out of the box. Once you get your ssh keys and settings.xml in correct places, use following command to deploy the application.

### Deploy application

	fab full_deploy:environment="dev",version="0.1.5" &> tugboat.log

### Testing application

	curl https://cloud-config.dev-xydinesh.com

Should return 4xx if deployment successful. Expectation is that, it shouldn’t return 5xx

### Delete application

	fab full_undeploy:environment=“dev”,version=“0.1.5”,ttl=0 &> tugboat.log

## Configuration

We know that deployment is easy for cloud configuration application. Let’s go over configuration.

### settings.xml

Put settings.xml in `~/.m2` directory. Make sure to update correct username and passwords in `settings.xml`

### Authentication credentials for team

In order to deploy with tugboat, update `.tugboat/nibiru.json` with

    "nibiru": {
	    // if team_uri is not specified here,
	    // NIBIRU_TEAM_URI environment variable must be set
	    // "team_uri": "https://nibiru/team/uri",
        "team_uri": "team-uri",

	    // if bearer_token is not specified here,
	    // NIBIRU_BEARER_TOKEN environment variable must be set
        // "bearer_token": "a nibiru api bearer token",
        "bearer_token": "token"

        // While not required, ssh key_filename can be provided here
        // "key_filename": "some path",
        "key_filename": "ssh-key"

        // While not required, ssh_user is defaulted to the "ubuntu" user
        "ssh_user": "username"
    }

