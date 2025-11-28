# bluepeak-bank
a simple banking web app used to demonstrate security vulnerabilities, test malicious attacks, and mitigations against them.

***Note***: this is the secure version of our app, the insecure version which can be used to test vulnerabilities and exploits can be found here: [bluepeak-insecure](https://github.com/willfranx/bluepeak-insecure)

The live site can be found here:

## Front-end (Client side)

To start the app locally, simply clone the repo and run:

`docker compose up`

You will be greeted by the home/login page:

![The Bluepeak Bank home/login page](frontend/src/assets/read-me/home-login.jpg)

If you are a new user, you will first need to create a new account. You will need a user name, email, and secure password.

![Create a new user/register](frontend/src/assets/read-me/create-account.jpg)

This page will send your email a one-time password and redirect you to the verify page. You will need to enter this password here to verify your account.

![One-time password email example](frontend/src/assets/read-me/otp.jpg)

![Verify the email for your new account](frontend/src/assets/read-me/verify.jpg)

Once your email has been verified, you can log in with the password you set, and view your accounts page. It will look like this, until you have added your first account, which you can do by selecting "Add your first account".

***Note***: Bluepeak bank does not use any real money. You will be entering numbers on a screen as a user, this app does not connect in any way to a real bank account or monetary institution.

![Create your first account](frontend/src/assets/read-me/first-account-1.jpg)

You can add a name for your account, select a checking or saving account type, and an amount for your first deposit.

![Add the details of your first account](frontend/src/assets/read-me/first-account-2.jpg)

The rest of the pages can be navigated to using the navbar on the top of the app.

![The navbar](frontend/src/assets/read-me/navbar.jpg)

These include: 

the transactions page, where you can see the transaction history of your accounts. Toggle between checking and saving to see the related transaction history.

![View your transaction history](frontend/src/assets/read-me/transactions.jpg)

the transfer page, where you can deposit to, withdraw from, and transfer to your own accounts, and those of another user by email.

![Transfer to another user](frontend/src/assets/read-me/transfer.jpg)

and lastly, the profile page, where you can view and change your username and email, as well as your password. Changing your email will require re-verification of the new email. You can also delete your user account here. This will require a confirmation and cannot be undone.

![Make profile changes](frontend/src/assets/read-me/profile.jpg)

## Back-end (Server side)

## Attacks/exploits and mitigations

## Pen testing (How-to)
