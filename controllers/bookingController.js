const sendEmail = require("../utils/ContactMailer");
const Booking = require("../models/booking");

const createBooking = async (req, res) => {
  const {
    FirstName,
    LastName,
    email,
    phone,
    Age,
    Location,
    PreferredArtist,
    Choice,
    Placement,
    Color,
    Size,
    Budget,
    Availability,
    Description,
  } = req.body;

  try {
    const booking = new Booking({
      FirstName,
      LastName,
      email,
      phone,
      Age,
      Location,
      PreferredArtist,
      Choice,
      Placement,
      Color,
      Size,
      Budget,
      Availability,
      Description,
    });

    // Save the booking to the database
    await booking.save();

    // Prepare the email data
    const emailData = {
      to: "bencyubahiro77@gmail.com",
      subject: "New Booking",
      text: `First Name: ${FirstName}\nLast Name: ${LastName}\nEmail: ${email}\nPhone: ${phone}\nAge: ${Age}\nLocation: ${Location}\nPreferred Artist: ${PreferredArtist}\nChoice: ${Choice}\nPlacement: ${Placement}\nColor: ${Color}\nSize: ${Size}\nBudget: ${Budget}\nAvailability: ${Availability}\nDescription: ${Description}`,
      html: `<p><strong>First Name:</strong> ${FirstName}</p><p><strong>Last Name:</strong> ${LastName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Age:</strong> ${Age}</p><p><strong>Location:</strong> ${Location}</p><p><strong>Preferred Artist:</strong> ${PreferredArtist}</p><p><strong>Choice:</strong> ${Choice}</p><p><strong>Placement:</strong> ${Placement}</p><p><strong>Color:</strong> ${Color}</p><p><strong>Size:</strong> ${Size}</p><p><strong>Budget:</strong> ${Budget}</p><p><strong>Availability:</strong> ${Availability}</p><p><strong>Description:</strong> ${Description}</p>`,
    };

    // Send the email
    await sendEmail(emailData);

    res.status(200).json({ success: true, message: "Booking created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

module.exports = createBooking;