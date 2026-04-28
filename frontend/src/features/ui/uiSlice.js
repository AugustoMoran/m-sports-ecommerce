import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    menuOpen: false,
    searchOpen: false,
  },
  reducers: {
    toggleMenu: (state) => { state.menuOpen = !state.menuOpen; },
    closeMenu: (state) => { state.menuOpen = false; },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen; },
    closeSearch: (state) => { state.searchOpen = false; },
  },
});

export const { toggleMenu, closeMenu, toggleSearch, closeSearch } = uiSlice.actions;
export default uiSlice.reducer;
