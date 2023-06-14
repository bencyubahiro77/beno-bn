const sendEmail = require("../utils/ContactMailer");
const Contact = require("../models/Contact");

const sendContactMessage = async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    const contact = new Contact({
      name,
      email,
      phone,
      message,
    });

    // Save the contact message to the database
    await contact.save();

    // Prepare the email data
    const emailData = {
      to: "bencyubahiro77@gmail.com",
      subject: "New Contact Message",
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Message:</strong> ${message}</p>`,
    };

    // Send the email
    await sendEmail(emailData);

    res.status(200).json({ success: true, message: "Contact message sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send contact message" });
  }
};

module.exports = sendContactMessage;
