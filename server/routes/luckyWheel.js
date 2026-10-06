const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

const LUCKY_ROW_PHONE = 'STORE_LUCKY_WHEEL';

// Winning prize pool (awarded prizes: 5k, 7k, 10%)
const WINNING_PRIZES = [
  { id: 1, label: 'Giảm 5.000₫', code: 'MAYMAN5K', sliceIndex: 1 },
  { id: 2, label: 'Giảm 7.000₫', code: 'MAYMAN7K', sliceIndex: 2 },
  { id: 3, label: 'Giảm 10%', code: 'MAYMAN10PT', sliceIndex: 3 },
  { id: 4, label: 'Giảm 5.000₫', code: 'MAYMAN5K', sliceIndex: 4 },
  { id: 5, label: 'Giảm 7.000₫', code: 'MAYMAN7K', sliceIndex: 5 },
];

const DEFAULT_LOSS_PRIZE = {
  id: 0,
  label: 'Chúc Bạn May Mắn Lần Sau',
  code: null,
  sliceIndex: 0
};

// In-memory fallback
let memoryWheelState = {
  totalSpins: 0,
  totalWins: 0,
  lastWinner: null
};

async function getWheelState() {
  if (!supabase) return memoryWheelState;
  try {
    const { data } = await supabase
      .from('users')
      .select('name')
      .eq('phone', LUCKY_ROW_PHONE)
      .eq('role', 'store_lucky_wheel')
      .maybeSingle();

    if (data && data.name) {
      return JSON.parse(data.name);
    }
  } catch (err) {
    console.warn('Get lucky wheel state error:', err);
  }
  return memoryWheelState;
}

async function saveWheelState(state) {
  memoryWheelState = state;
  if (!supabase) return;
  try {
    await supabase.from('users').upsert(
      {
        phone: LUCKY_ROW_PHONE,
        role: 'store_lucky_wheel',
        name: JSON.stringify(state)
      },
      { onConflict: 'phone' }
    );
  } catch (err) {
    console.warn('Save lucky wheel state error:', err);
  }
}

// GET status (current global spin count)
router.get('/status', async (req, res) => {
  try {
    const state = await getWheelState();
    const nextWinIn = 10 - (state.totalSpins % 10);
    return res.json({
      success: true,
      totalSpins: state.totalSpins,
      totalWins: state.totalWins,
      nextWinIn: nextWinIn === 0 ? 10 : nextWinIn
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST spin
// Rule: Auto "Chúc bạn may mắn lần sau". Only every 10th spin of all users awards a prize!
router.post('/spin', async (req, res) => {
  try {
    const state = await getWheelState();
    state.totalSpins = (state.totalSpins || 0) + 1;

    // Check if this is the 10th spin
    const isWinner = state.totalSpins % 10 === 0;

    let resultPrize;
    if (isWinner) {
      // Pick a random prize from winning pool
      const pick = WINNING_PRIZES[Math.floor(Math.random() * WINNING_PRIZES.length)];
      resultPrize = { ...pick };
      state.totalWins = (state.totalWins || 0) + 1;
      state.lastWinner = {
        prize: pick.label,
        code: pick.code,
        time: new Date().toISOString()
      };
    } else {
      // Always "Chúc bạn may mắn lần sau"
      resultPrize = { ...DEFAULT_LOSS_PRIZE };
    }

    await saveWheelState(state);

    return res.json({
      success: true,
      isWinner,
      prize: resultPrize,
      totalSpins: state.totalSpins,
      message: isWinner
        ? `🎉 Chúc mừng bạn là người may mắn thứ ${state.totalSpins}! Bạn nhận được ${resultPrize.label}.`
        : 'Chúc bạn may mắn lần sau! Hãy tiếp tục đặt hàng để nhận thêm lượt quay may mắn nhé.'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
