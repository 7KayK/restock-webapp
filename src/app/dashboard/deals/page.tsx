import { redirect } from 'next/navigation'

// The Deals page was folded into the Shopping Trip page — "Make a cart"
// and "Product info" now live there, next to the list they price. This
// redirect keeps any old links/bookmarks (and the Telegram bot, if it
// ever points here) working instead of 404ing.
export default function DealsPage() {
  redirect('/dashboard/shopping')
}
