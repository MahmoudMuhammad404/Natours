<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Natours</h1>
  <h1>Key Features 📝</h1>
  <h2>Authentication and Authorization</h2>
  <ul>
    <li>Sign up, Log in, Logout, Update, and reset password.</li>
    <li>User profile: Update username, photo, email, password, and other information.</li>
    <li>A user can be either a regular user, an admin, a lead guide, or a guide.</li>
    <li>When a user signs up, they are by default a regular user.</li>
  </ul>

  <h2>Tour</h2>
  <ul>
    <li>Manage booking, check tour map, check users' reviews and rating.</li>
    <li>Tours can be created by an admin user or a lead-guide.</li>
    <li>Tours can be seen by every user.</li>
    <li>Tours can be updated by an admin user or a lead guide.</li>
    <li>Tours can be deleted by an admin user or a lead-guide.</li>
  </ul>

  <h2>Bookings</h2>
  <ul>
    <li>Only regular users can book tours (make a payment).</li>
    <li>Regular users cannot book the same tour twice.</li>
    <li>Regular users can see all the tours they have booked.</li>
    <li>An admin user or a lead guide can see every booking on the app.</li>
    <li>An admin user or a lead guide can delete any booking.</li>
    <li>An admin user or a lead guide can create a booking (manually, without payment).</li>
    <li>An admin user or a lead guide cannot create a booking for the same user twice.</li>
    <li>An admin user or a lead guide can edit any booking.</li>
  </ul>

  <h2>Reviews</h2>
  <ul>
    <li>Only regular users can write reviews for tours that they have booked.</li>
    <li>All users can see the reviews of each tour.</li>
    <li>Regular users can edit and delete their own reviews.</li>
    <li>Regular users cannot review the same tour twice.</li>
    <li>An admin can delete any review.</li>
  </ul>

  <h2>Credit Card Payment</h2>
  <ul>
    <li>Using Stripe.</li>
  </ul>

  <h2>How To Use 🤔</h2>
<ul>
  <li>Check the <a href="https://documenter.getpostman.com/view/30204339/2sA35MzJrG">API Documentation</a> for more info.</li>
</ul>

<h2>Build With 🏗️</h2>
<ul>
  <li>NodeJS - JS runtime environment</li>
  <li>Express - The web framework used</li>
  <li>Mongoose - Object Data Modelling (ODM) library</li>
  <li>MongoDB Atlas - Cloud database service</li>
  <li>Pug - High performance template engine</li>
  <li>JSON Web Token - Security token</li>
  <li>ParcelJS - Blazing fast, zero configuration web application bundler</li>
  <li>Stripe - Online payment API and Making payments on the app</li>
  <li>Postman - API testing</li>
  <li>Resend - Email delivery platform</li>
  <li>Render - Cloud platform</li>
  <li>Mapbox - Displaying the different locations of each tour</li>
</ul>

</body>
</html>