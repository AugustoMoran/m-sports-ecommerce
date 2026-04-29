import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiX, FiMessageSquare, FiShoppingBag, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage } from './chatApi';
import { formatCurrency } from './formatCurrency';
import useCart from './useCart';

// ...existing code from ChatWidget.jsx...

// ─── Session ID ───────────────────────────────────────────────────────────────
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ...existing code from ChatWidget.jsx...

export default function ChatWidget() {
  // ...existing code from ChatWidget.jsx...
}
