// Package reservations applies the cancellation policy used by the booking service.
package reservations

import "time"

// CanCancel reports whether a booking is still within its cancellation window.
func CanCancel(now, startsAt time.Time) bool {
	return startsAt.Sub(now) >= 24*time.Hour
}
