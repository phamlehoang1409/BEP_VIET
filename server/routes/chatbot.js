const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const db = require('../db/database');

// Default fallback foods in case database is cold
const FALLBACK_FOODS = [
  { id: 1, name: 'Mì Indomie Trộn Bò Trứng', price: 45000, category_name: 'Mì Trộn Đặc Biệt', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', is_available: 1, spicy_level: 1, rating: 5.0 },
  { id: 2, name: 'Mì Indomie Xá Xíu Quay Mật Ong', price: 49000, category_name: 'Mì Trộn Đặc Biệt', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', is_available: 1, spicy_level: 0, rating: 4.9 },
  { id: 3, name: 'Mì Indomie Hải Sản Sa Tế Cay', price: 55000, category_name: 'Mì Trộn Đặc Biệt', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80', is_available: 1, spicy_level: 2, rating: 5.0 },
  { id: 4, name: 'Nem Chua Rán Phố Cổ (5 chiếc)', price: 35000, category_name: 'Đồ Ăn Vặt Chiên Giòn', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80', is_available: 1, spicy_level: 0, rating: 4.8 },
  { id: 5, name: 'Khoai Tây Chiên Lắc Phô Mai', price: 30000, category_name: 'Đồ Ăn Vặt Chiên Giòn', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80', is_available: 1, spicy_level: 0, rating: 4.7 },
  { id: 6, name: 'Trà Tắc Khổng Lồ Mật Ong', price: 18000, category_name: 'Trà & Nước Giải Khát', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', is_available: 1, spicy_level: 0, rating: 5.0 }
];

async function getAllFoods() {
  try {
    if (supabase) {
      const { data } = await supabase.from('foods').select('*').eq('is_available', 1);
      if (data && data.length > 0) return data;
    } else if (db && db.query) {
      const rows = db.query('SELECT * FROM foods WHERE is_available = 1');
      if (rows && rows.length > 0) return rows;
    }
  } catch (e) {
    console.error('Error fetching foods for chatbot:', e);
  }
  return FALLBACK_FOODS;
}

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
  try {
    const { message = '' } = req.body;
    const cleanMsg = message.trim().toLowerCase();

    if (!cleanMsg) {
      return res.json({
        success: true,
        reply: 'Xin chào! Em là **Bếp Việt AI Assistant** 🤖. Em có thể giúp gì cho Quý khách hôm nay ạ?',
        suggestedFoods: [],
        quickReplies: ['Gợi ý món bán chạy 🔥', 'Thực đơn dưới 50k 💰', 'Món cay sa tế 🌶️', 'Mã giảm giá hôm nay 🎁']
      });
    }

    const foods = await getAllFoods();

    // 1. Gợi ý món cay
    if (cleanMsg.includes('cay') || cleanMsg.includes('sa tế') || cleanMsg.includes('sate')) {
      const spicyFoods = foods.filter(f => (f.spicy_level > 0 || (f.name || '').toLowerCase().includes('cay') || (f.name || '').toLowerCase().includes('sa tế'))).slice(0, 3);
      return res.json({
        success: true,
        reply: 'Dạ nếu Quý khách thích vị cay nồng kích thích vị giác, em xin gợi ý các món cay sa tế đậm đà nức tiếng của Bếp Việt dưới đây ạ! 🌶️♨️',
        suggestedFoods: spicyFoods.length > 0 ? spicyFoods : foods.slice(0, 2),
        quickReplies: ['Thêm trà tắc giải nhiệt 🧋', 'Combo 2 người 🍱', 'Xem toàn bộ thực đơn 🍜']
      });
    }

    // 2. Món bò, thịt, xá xíu, gà
    if (cleanMsg.includes('bò') || cleanMsg.includes('bo') || cleanMsg.includes('thịt') || cleanMsg.includes('xá xíu') || cleanMsg.includes('gà')) {
      const proteinFoods = foods.filter(f => {
        const n = (f.name || '').toLowerCase();
        return n.includes('bò') || n.includes('xá xíu') || n.includes('gà') || n.includes('thịt');
      }).slice(0, 3);
      return res.json({
        success: true,
        reply: 'Dạ các món ngập thịt bò Mỹ mềm thơm, xá xíu quay mật ong và đùi gà giòn rụm của quán luôn là lựa chọn hàng đầu cho bữa ăn no nê giàu năng lượng ạ! 🥩🍗',
        suggestedFoods: proteinFoods.length > 0 ? proteinFoods : foods.slice(0, 2),
        quickReplies: ['Thêm trứng lòng đào 🍳', 'Mã giảm giá 🎁', 'Xem giỏ hàng 🛒']
      });
    }

    // 3. Tiết kiệm / Dưới 50k / Giá rẻ / Học sinh sinh viên
    if (cleanMsg.includes('rẻ') || cleanMsg.includes('tiết kiệm') || cleanMsg.includes('50k') || cleanMsg.includes('sinh viên') || cleanMsg.includes('ít tiền')) {
      const budgetFoods = foods.filter(f => f.price <= 45000).slice(0, 3);
      return res.json({
        success: true,
        reply: 'Dạ Bếp Việt có các món chuẩn ngon - bổ - rẻ dưới 50k cực kỳ no nê và hợp túi tiền học sinh sinh viên đây ạ! 💰🍲',
        suggestedFoods: budgetFoods.length > 0 ? budgetFoods : foods.slice(0, 2),
        quickReplies: ['Quay vòng may mắn 🎁', 'Gợi ý món ăn vặt 🍟', 'Thực đơn đầy đủ 🍜']
      });
    }

    // 4. Đồ ăn vặt & Nước uống
    if (cleanMsg.includes('ăn vặt') || cleanMsg.includes('nem chua') || cleanMsg.includes('khoai tây') || cleanMsg.includes('nước') || cleanMsg.includes('trà')) {
      const snackFoods = foods.filter(f => {
        const n = (f.name || '').toLowerCase();
        return n.includes('nem') || n.includes('khoai') || n.includes('trà') || n.includes('nước') || f.category_id === 4 || f.category_id === 5;
      }).slice(0, 3);
      return res.json({
        success: true,
        reply: 'Dạ quán có nem chua rán giòn rụm, khoai tây lắc phô mai béo ngậy và trà tắc mật ong khổng lồ mát lạnh cực đã ạ! 🍟🧋',
        suggestedFoods: snackFoods.length > 0 ? snackFoods : foods.slice(3, 6),
        quickReplies: ['Mì Indomie bò trứng 🍜', 'Mã Freeship 🚚', 'Đặt giao ngay ⚡']
      });
    }

    // 5. Khuyến mãi / Mã giảm giá / Voucher
    if (cleanMsg.includes('mã') || cleanMsg.includes('khuyến mãi') || cleanMsg.includes('voucher') || cleanMsg.includes('giảm giá') || cleanMsg.includes('freeship')) {
      return res.json({
        success: true,
        reply: '🎉 **Các mã ưu đãi HOT nhất hôm nay tại Bếp Việt:**\n- **INDOMIE20**: Giảm 20% cho đơn từ 80.000đ\n- **HANOI15K**: Trừ 15.000đ phí giao hàng nội thành\n- **BEPVIETVIP**: Giảm 25% tối đa 100k cho đơn từ 120k\n\n👉 Ngoài ra, mỗi đơn hoàn tất bạn sẽ nhận thêm **+1 lượt quay Vòng Quay May Mắn** và tích lũy **Bếp Xu** giảm trừ trực tiếp!',
        suggestedFoods: foods.slice(0, 2),
        quickReplies: ['Vào thực đơn chọn món 🍜', 'Quay Vòng May Mắn 🎁', 'Xem Bếp Xu 🪙']
      });
    }

    // 6. Giờ mở cửa & Khu vực giao hàng
    if (cleanMsg.includes('mở cửa') || cleanMsg.includes('giờ') || cleanMsg.includes('địa chỉ') || cleanMsg.includes('ở đâu') || cleanMsg.includes('ship') || cleanMsg.includes('giao')) {
      return res.json({
        success: true,
        reply: '⏰ **Thông Tin Phục Vụ Bếp Việt Gourmet:**\n- **Giờ mở cửa:** 08:00 - 23:00 hàng ngày (giao hỏa tốc xuyên trưa & tối)\n- **Khu vực giao hàng:** Nội thành Hà Nội (Hoàn Kiếm, Ba Đình, Đống Đa, Cầu Giấy, Hai Bà Trưng, Thanh Xuân...)\n- **Thời gian giao:** Trung bình 20 - 35 phút là nóng hổi tới tay Quý khách!\n- **Hotline hỗ trợ:** 0353859726',
        suggestedFoods: [],
        quickReplies: ['Xem thực đơn 🍜', 'Gợi ý combo 2 người 🍱', 'Chat với chủ quán 👨‍🍳']
      });
    }

    // 7. Tra cứu đơn hàng
    if (cleanMsg.includes('đơn') || cleanMsg.includes('tra cứu') || cleanMsg.includes('ord-') || cleanMsg.includes('tình trạng')) {
      return res.json({
        success: true,
        reply: '📦 Quý khách có thể xem tiến trình đơn hàng thời gian thực tại mục **"Đơn Của Tôi"** trên thanh menu hoặc nhập số điện thoại để tra cứu. Nếu cần bếp thúc giục làm gấp, quý khách có thể chuyển sang tab **"Chat Với Chủ Quán"** để nhắn trực tiếp ạ!',
        suggestedFoods: [],
        quickReplies: ['Vào mục Đơn Của Tôi 📦', 'Hotline quán: 0353859726 📞', 'Chat với chủ quán 👨‍🍳']
      });
    }

    // 8. Chào hỏi & Mặc định
    const bestFoods = foods.slice(0, 3);
    return res.json({
      success: true,
      reply: `Dạ Bếp Việt Gourmet xin chào Quý khách! 🍜✨\nQuán chuyên các món Mì Indomie trộn sốt đặc biệt, đồ ăn vặt chiên giòn và nước giải khát giao hỏa tốc tận nơi. Dưới đây là các món được khách hàng yêu thích nhất, quý khách tham khảo nhé!`,
      suggestedFoods: bestFoods,
      quickReplies: ['Gợi ý món cay 🌶️', 'Món ngập thịt bò 🥩', 'Thực đơn dưới 50k 💰', 'Mã giảm giá hôm nay 🎁']
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ error: 'Chatbot service error' });
  }
});

module.exports = router;
