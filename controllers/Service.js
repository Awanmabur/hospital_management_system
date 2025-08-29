// ServiceController.js
const Service = require('../models/Service');
const User = require('../models/User');
const Event = require('../models/Event');
const Promotion = require('../models/Promotion');
const Review = require('../models/Review');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;

const Hotel = Service.discriminators.hotel;
const Car = Service.discriminators.car;
const EventHall = Service.discriminators.eventhall;
const DJ = Service.discriminators.dj;
const Photographer = Service.discriminators.photographer;
const Caterer = Service.discriminators.caterer;
const Decorator = Service.discriminators.decorator;
const MakeupArtist = Service.discriminators.makeup_artist;
// const Other = Service.discriminators.others;


const models = {
  hotel: Hotel,
  car: Car,
  eventhall: EventHall,
  dj: DJ,
  photographer: Photographer,
  caterer: Caterer,
  decorator: Decorator,
  makeup_artist: MakeupArtist,
  // others: Other
};


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});


exports.index = async (req, res) => {
  try {
    const userId = req.user;
    const isUserLogin = await User.findById(userId);

    const services = await Service.find()

    const eventhalls = await Service.find({category:"eventhall"})

    const cars = await Service.find({category:"car"})

    const hotels = await Service.find({category:"hotel"})

    const caterers = await Service.find({category:"caterer"})

    const makeup_artists = await Service.find({category:"makeup_artist"})

    const djs = await Service.find({category:"dj"})

    const decorators = await Service.find({category:"decorator"})

    const photographers = await Service.find({category:"Photographer"})

    const events = await Event.find({});
    const promotions = await Promotion.find({
      type: { $in: ['service', 'event'] },
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const eventIds = promotions.map(p => p.itemId);
    const promotedServices = await Service.find({ _id: { $in: eventIds } });
    const eventsPromoted = await Event.find({ _id: { $in: eventIds } });
    const promotedEvents = [...promotedServices, ...eventsPromoted];


    res.render('services/service', {
      services, isUserLogin, userId, promotedEvents,
      decorators, eventhalls, caterers, djs,
      photographers, makeup_artists, cars, hotels,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Could not load Services.');
    res.redirect('/');
  }
};


exports.show = async (req, res) => {
  try {
    const userId = req.user;
    const isUserLogin = await User.findById(userId);

    const user = req.user ? await User.findById(req.user) : null;

    const { serviceId, id, type } = req.params;

    const service = await Service.findById(id);
    if (!service) {
     req.flash('error', 'Service not found');
     return res.redirect('/');
    }

    let item = null;

    if (type === 'service') {
      item = await Service.findById(id);
    } else {
      req.flash('error', 'Service type is invalid.');
      return res.redirect('/');
    }

    let rating = null;
    let reviews = [];

    if (userId) {
      // Only find personal rating and reviews if logged in
      rating = await Review.findOne({ service: service._id, userId: userId._id });
      reviews = await Review.find({ service: service._id }).populate('user');
    } else {
      // Fetch public reviews only
      reviews = await Review.find({ service: service._id }).populate('user');
    }

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Format reviews for EJS
    const formattedReviews = reviews.map((review) => ({
      userName: review.user?.username || 'Anonymous',
      comment: review.comment,
      rating: review.rating
    }));

    // Increment views count
    service.views += 1;
    await service.save();


    // Render page for both logged in and not logged in
    res.render('services/show', {
      service,
      serviceId,
      existingRating: rating,
      averageRating,
      reviews: formattedReviews,
      user,
      item,
      isUserLogin,
      type: 'service'
    });
  } catch (error) {
    req.flash('error', 'Service failed to load.');
    res.redirect('/');
  }
};


// Create or update a rating
exports.rating = async (req, res) => {
     const token = req.session.token;
  try {

    if (!token) {
      req.flash('error', 'Session expired. Please log in.');
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const { id } = req.params;
    const { rating, comment } = req.body;

    const serviceId = req.params.id;

    // Check if service exists
    const service = await  Service.findOne({ _id: id });
    if (!service) return res.status(404).json({ message: 'service not found' });

    // Check if user has already rated this service
    let existingRating = await Review.findOne({ user: user._id, service: service });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
    } else {
      // Create new rating
      const newRating = new Review({
        user: user._id,
        service: service,
        rating,
        comment
      });
      await newRating.save();
    }

    req.flash('success', 'Rating updated successfully.');
    res.redirect(`/showService/${serviceId}`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Error updating event.');
    res.redirect('/adminProfile');
  }
};


exports.store = async (req, res) => {
  const token = req.session.token;

  if (!token) {
    req.flash('error', 'Session expired. Please log in.');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const {
      name,
      description,
      category,
      location,
      type,
      // reviews,
      // contact{
        email,
        phone,
      // },
      availability,

      // Car
      brand,
      model,
      seating_capacity,
      rent_per_day,
      fuel_type,
      transmission,
      features,
      air_conditioning,

      // Hotel
      amenities,
      check_in_time,
      check_out_time,
      price_per_night,

      // Event Hall
      capacity,
      price_per_day,
      facilities,

      // DJ
      dj_genres,
      dj_years,
      dj_price,
      dj_equipment,
      dj_link,

      // Photographer
      photographer_years,
      photographer_price,
      photographer_specialties,
      photographer_portfolio,

      // Caterer
      menu_items,
      price_per_plate,
      cuisine_types,
      minimum_order,
      vegetarian_options,
      halal_options,
      packages,

      // Decorator
      decorator_price,
      services_offered,
      portfolio,
      decorator_years,

      // Makeup Artist
      makeup_specialties,
      makeup_packages,
      makeup_years,
      makeup_price,
      makeup_link,

      // Other
      // otherCategory,
      // otherDescription,

      // ...rest
    } = req.body;


    let images = [];

    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const buffer = await sharp(file.buffer)
          .resize(800)
          .jpeg({ quality: 80 })
          .toBuffer();

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'Service_Images' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        images.push(result.secure_url);
      }
    }

    const Model = models[category];
    if (!Model) return res.status(400).json({ message: 'Invalid category' });

    const serviceData = {
      created_by: user,
      name,
      description,
      category,
      type:"service",
      // reviews,
      location,
      images,
      availability,
      email,
      phone,
    };

    if (category === 'car') {
      Object.assign(serviceData, {
        brand,
        model,
        seating_capacity,
        rent_per_day,
        fuel_type,
        transmission,
        features,
        air_conditioning,
      });
    } else if (category === 'hotel') {
      Object.assign(serviceData, {
        amenities,
        check_in_time,
        check_out_time,
        price_per_night,
      });
    } else if (category === 'eventhall') {
      Object.assign(serviceData, {
        capacity,
        price_per_day,
        facilities,
      });
    } else if (category === 'dj') {
      Object.assign(serviceData, {
        dj_genres,
        dj_years,
        dj_price,
        dj_equipment,
        dj_link,
      });
    } else if (category === 'photographer') {
      Object.assign(serviceData, {
        photographer_years,
        photographer_price,
        photographer_specialties,
        photographer_portfolio,
      });
    } else if (category === 'caterer') {
      Object.assign(serviceData, {
        menu_items,
        price_per_plate,
        cuisine_types,
        packages,
        minimum_order,
        vegetarian_options,
        halal_options,
      });
    } else if (category === 'decorator') {
      Object.assign(serviceData, {
        decorator_price,
        services_offered,
        portfolio,
        decorator_years,
      });
    } else if (category === 'makeup_artist') {
      Object.assign(serviceData, {
        makeup_specialties,
        makeup_packages,
        makeup_years,
        makeup_price,
        makeup_link,
      });
    }
    // else if (category === 'others') {
    //   Object.assign(serviceData, {
    //     category: otherCategory,
    //     description: otherDescription,
    //     price_range,
    //     availability
    //   });
    // }

    const service = new Model(serviceData);
    await service.save();

    res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};




// Get Service for Edit
exports.edit = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash('error', 'Session expired. Please log in again.');
    return res.redirect('/login');
  }

  try {
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    const ServiceId = req.params.id;
    const isUserLogin = await User.findById(userId);

    const service = await Service.findById(ServiceId);
    if (!service) {
      req.flash('error', 'Service not found.');
      return res.redirect('/profile');
    }

    res.render('./superAdmin/edit_service', { service, isUserLogin });

  } catch (err) {
    console.error('Error retrieving Service:', err);
    req.flash('error', 'Error retrieving Service.');
    res.redirect('/profile');
  }
};


// Edit Service
exports.update = async (req, res) => {
  const token = req.session.token;

  if (!token) {
    req.flash('error', 'Session expired. Please log in.');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const { id } = req.params;
    const {
      name,
      description,
      location,
      email,
      category,
      phone,
      availability,

      // Car
      brand,
      model,
      seating_capacity,
      rent_per_day,
      fuel_type,
      transmission,
      features,
      air_conditioning,

      // Hotel
      amenities,
      check_in_time,
      check_out_time,
      price_per_night,

      // Event Hall
      capacity,
      price_per_day,
      facilities,

      // DJ
      dj_genres,
      dj_years,
      dj_price,
      dj_equipment,
      dj_link,

      // Photographer
      photographer_years,
      photographer_price,
      photographer_specialties,
      photographer_portfolio,

      // Caterer
      menu_items,
      price_per_plate,
      cuisine_types,
      packages,
      minimum_order,
      vegetarian_options,
      halal_options,

      // Decorator
      decorator_price,
      services_offered,
      portfolio,
      decorator_years,

      // Makeup Artist
      makeup_specialties,
      makeup_packages,
      makeup_years,
      makeup_price,
      makeup_link,
    } = req.body;

    const Model = models[category];
    if (!Model) {
      req.flash('error', 'Invalid category');
      return res.redirect('/adminProfile');
    }

    const service = await Model.findById(id);

    if (!service || !service.created_by.equals(user._id)) {
      req.flash('error', 'Unauthorized or service not found.');
      return res.redirect('/adminProfile');
    }

    let images = service.image;

    // If a new file is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (service.image) {
        const publicId = service.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`Service_Images/${publicId}`);
      }

      const buffer = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'Service_Images' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      images = result.secure_url;
    }

    console.log(images);

    // Update common fields
    service.name = name;
    service.description = description;
    service.location = location;
    service.email = email;
    service.category = category;
    service.phone = phone;
    service.availability = availability;
    service.images = images;


    // Category-specific updates
    if (category === 'car') {
      Object.assign(service, {
        brand,
        model,
        seating_capacity,
        rent_per_day,
        fuel_type,
        transmission,
        features,
        air_conditioning,
      });
    } else if (category === 'hotel') {
      Object.assign(service, {
        amenities,
        check_in_time,
        check_out_time,
        price_per_night,
      });
    } else if (category === 'eventhall') {
      Object.assign(service, {
        capacity,
        price_per_day,
        facilities,
      });
    } else if (category === 'dj') {
      Object.assign(service, {
        dj_genres,
        dj_years,
        dj_price,
        dj_equipment,
        dj_link,
      });
    } else if (category === 'photographer') {
      Object.assign(service, {
        photographer_years,
        photographer_price,
        photographer_specialties,
        photographer_portfolio,
      });
    } else if (category === 'caterer') {
      Object.assign(service, {
        menu_items,
        price_per_plate,
        cuisine_types,
        packages,
        minimum_order,
        vegetarian_options,
        halal_options,
      });
    } else if (category === 'decorator') {
      Object.assign(service, {
        decorator_price,
        services_offered,
        portfolio,
        decorator_years,
      });
    } else if (category === 'makeup_artist') {
      Object.assign(service, {
        makeup_specialties,
        makeup_packages,
        makeup_years,
        makeup_price,
        makeup_link,
      });
    }

    await service.save();

    req.flash('success', 'Service updated successfully.');
    res.redirect(`/showService/${id}`); // Adjust redirect URL as needed
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating service.');
    res.redirect('/adminProfile');
  }
};


// // Edit Service
// exports.update = async (req, res) => {
//   const token = req.session.token;
//
//   if (!token) {
//     req.flash('error', 'Session expired. Please log in.');
//     return res.redirect('/login');
//   }
//
//   try {
//     const decoded = jwt.verify(token, 'jwtSecret');
//     const user = await User.findById(decoded.userId);
//
//     const ServiceId = req.params.id;
//     const existingService = await Service.findById(ServiceId);
//
//     if (!existingService || !existingService.created_by.equals(user._id)) {
//       req.flash('error', 'Unauthorized or Service not found.');
//       return res.redirect('/adminProfile');
//     }
//
//     const {
//       name,
//       description,
//       category,
//       location,
//       price_per_day,
//       capacity,
//       type,
//       image,
//       availability
//     } = req.body;
//
//     let imageUrl = existingService.image;
//
//     // If a new file is uploaded
//     if (req.file) {
//       // Delete old image from Cloudinary
//       if (existingService.image) {
//         const publicId = existingService.image.split('/').pop().split('.')[0];
//         await cloudinary.uploader.destroy(`Service_Images/${publicId}`);
//       }
//
//       const buffer = await sharp(req.file.buffer)
//         .resize(800)
//         .jpeg({ quality: 80 })
//         .toBuffer();
//
//       const result = await new Promise((resolve, reject) => {
//         cloudinary.uploader.upload_stream(
//           { folder: 'Service_Images' },
//           (error, result) => {
//             if (error) reject(error);
//             else resolve(result);
//           }
//         ).end(buffer);
//       });
//
//       imageUrl = result.secure_url;
//     }
//
//     existingService.name = name;
//     existingService.description = description;
//     existingService.category = category;
//     existingService.price_per_day = price_per_day;
//     existingService.location = location;
//     existingService.image = imageUrl;
//     existingService.capacity = capacity;
//     existingService.availability = availability;
//
//     await existingService.save();
//
//     req.flash('success', 'Service updated successfully.');
//     res.redirect(`/show/${ServiceId}`);
//   } catch (error) {
//     console.error(error);
//     req.flash('error', 'Error updating Service.');
//     res.redirect('/adminProfile');
//   }
// };

// Delete Service
exports.destroy = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash('error', 'Session expired. Please log in again.');
    return res.redirect('/login');
  }

  try {
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    const ServiceId = req.params.ServiceId;

    const Service = await Service.findById(ServiceId);
    if (!Service) {
      req.flash('error', 'Service not found.');
      return res.redirect('/profile');
    }

    if (Service.image) {
      const publicId = Service.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`Service_Images/${publicId}`);
    }

    await Service.deleteOne({ _id: ServiceId });
    req.flash('success', 'Service deleted successfully.');
    res.redirect('/profile');
  } catch (err) {
    console.error('Error deleting Service:', err);
    req.flash('error', 'Error deleting Service.');
    res.redirect('/');
  }
};
