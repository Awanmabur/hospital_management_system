
// ===== controllers/promotionController.js =====
const Promotion = require('../models/Promotion');
const axios = require('axios');
const Event = require('../models/Event');
const Service = require('../models/Service');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.create = async (req, res) => {
  const token = req.session.token;
  const { type, id } = req.params;

  const userId = req.user;

  const isUserLogin = await User.findById(userId);


  if (!token) {
    req.flash('error', 'Session expired. Please log in.');
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    let item = null;

    if (type === 'event') {
      item = await Event.findById(id);
    } else if (type === 'service') {
      item = await Service.findById(id);
    } else {
      return res.status(400).send('Invalid booking type');
    }

    if (!item) return res.status(404).send('Item not found');


    res.render('promotion/create', {type, item, user, userId, isUserLogin});
  } catch (error) {
    console.log(error);
    req.flash('error', 'Could not load events.');
    res.redirect('/');
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

    const { package, itemId, type, paymentMethod } = req.body;

    const packageMap = {
      silver: { days: 1, price: 5 },
      gold: { days: 3, price: 12 },
      platinum: { days: 7, price: 25 }
    };

    const selectedPackage = packageMap[package];
    if (!selectedPackage) {
      req.flash('error', 'Invalid promotion package');
      return res.redirect('back');
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + selectedPackage.days);

    const promotion = await Promotion.create({
      userId: user,
      itemId: itemId,
      type,
      package,
      price: selectedPackage.price,
      method: paymentMethod,
      status: 'active',
      paid_at: new Date(),
      startDate: start,
      endDate: end
    });

    await promotion.save()

    req.flash('success', 'Promotion activated successfully!');
    res.redirect(`/show/event/${itemId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong');
    res.redirect('back');
  }
};


exports.listPromotions = async (req, res) => {
  const promotions = await Promotion.find({ owner: req.user._id }).populate('itemId');
  res.render('promotions/list', { promotions });
};

exports.renewPromotion = async (req, res) => {
  const { id } = req.params;
  const { package } = req.body;

  const daysMap = { silver: 1, gold: 3, platinum: 7 };
  const priceMap = { silver: 5, gold: 12, platinum: 25 };

  const duration = daysMap[package];
  const newEnd = new Date();
  newEnd.setDate(newEnd.getDate() + duration);

  await Promotion.findByIdAndUpdate(id, {
    package,
    endDate: newEnd,
    price: priceMap[package],
    status: 'active'
  });

  req.flash('success', 'Promotion renewed successfully');
  res.redirect('/my/promotions');
};

exports.cancelPromotion = async (req, res) => {
  await Promotion.findByIdAndUpdate(req.params.id, { status: 'expired' });
  req.flash('info', 'Promotion cancelled');
  res.redirect('/my/promotions');
};

exports.adminList = async (req, res) => {
  const promotions = await Promotion.find().populate('owner itemId');
  res.render('admin/promotions', { promotions });
};

// exports.createPromotion = async (req, res) => {
//   const { package, itemId, type } = req.body;
//   const user = req.user;
//   const packageMap = {
//     silver: { days: 1, price: 5 },
//     gold: { days: 3, price: 12 },
//     platinum: { days: 7, price: 25 }
//   };
//
//   const { days, price } = packageMap[package];
//
//   const response = await axios.post('https://api.flutterwave.com/v3/payments', {
//     tx_ref: `PROMO-${Date.now()}`,
//     amount: price,
//     currency: 'USD',
//     redirect_url: 'https://your-site.com/promotions/complete',
//     customer: { email: user.email, name: user.name },
//     meta: { itemId, type, package },
//     customizations: {
//       title: 'Promote Your Event/Service',
//       description: `Promotion Package: ${package}`
//     }
//   }, {
//     headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
//   });
//
//   res.redirect(response.data.data.link);
// };
//
// exports.completePromotionPayment = async (req, res) => {
//   const { status, transaction_id } = req.query;
//   if (status === 'successful') {
//     const txDetails = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
//       headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
//     });
//
//     const { meta, amount } = txDetails.data.data;
//     const start = new Date();
//     const end = new Date();
//     end.setDate(end.getDate() + (meta.package === 'silver' ? 1 : meta.package === 'gold' ? 3 : 7));
//
//     await Promotion.create({
//       owner: req.user._id,
//       itemId: meta.itemId,
//       type: meta.type,
//       package: meta.package,
//       price: amount,
//       startDate: start,
//       endDate: end,
//       status: 'active'
//     });
//     req.flash('success', 'Promotion successful!');
//   } else {
//     req.flash('error', 'Payment failed or cancelled.');
//   }
//   res.redirect('/my/promotions');
// };
