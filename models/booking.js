const mongoose = require("mongoose");

const PreferredArtisOptions = ["Kharlaa", "Moochie", "Raine", "Valerie","No Preference", "First Available"];
const ChoiceOptions =["Tattoo", "Body Piercing"];
const ColorOptions =["N/A or Not sure", "Color","Blackwork","Black and Gray","Both Color and Black and Gray" ];

const BookingSchema = new mongoose.Schema(
  {
    FirstName: {
      type: String,
      required: true,
    },
    LastName: {
        type: String,
        required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    Age: {
        type: Number,
        required: true,
    },
    Location: {
        type: String,
        required: true,
    },
    PreferredArtist: {
        type: String,
        enum: PreferredArtisOptions,
        required: true,
    },
    Choice:{
        type: String,
        enum: ChoiceOptions,
        required: true,
    },
    Placement: {
        type: String,
        required: true,
    },
    Color: {
        type: String,
        enum:ColorOptions,
        required: true,
    },
    Size: {
        type: String,
        required: true,
    },
    Budget: {
        type: String,
        required: true,
    },
    Availability: {
        type: String,
        required: true,
    },
    Description:{
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);