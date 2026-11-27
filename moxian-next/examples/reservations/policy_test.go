package reservations

import (
	"testing"
	"time"
)

func TestCancellationBoundary(t *testing.T) {
	start := time.Date(2026, 11, 28, 12, 0, 0, 0, time.UTC)
	cases := []struct {
		name string
		lead time.Duration
		want bool
	}{
		{"more than one day", 24*time.Hour + time.Nanosecond, true},
		{"exactly one day", 24 * time.Hour, true},
		{"under one day", 24*time.Hour - time.Nanosecond, false},
		{"already started", -time.Second, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := CanCancel(start.Add(-c.lead), start); got != c.want {
				t.Fatalf("lead %s: got %t, want %t", c.lead, got, c.want)
			}
		})
	}
}
