package recurring

import (
	"testing"
	"time"
)

func TestMonthlyOccurrencesClampAtMonthEnd(t *testing.T) {
	start := time.Date(2026, time.January, 31, 0, 0, 0, 0, time.Local)
	e := Expense{ID: 1, Name: "Financiamento", Amount: 100, Frequency: Monthly, StartDate: start, Status: Active}
	got := occurrences(e, time.Date(2026, time.January, 1, 0, 0, 0, 0, time.Local), time.Date(2026, time.April, 1, 0, 0, 0, 0, time.Local))
	if len(got) != 3 || got[1].Month() != time.February || got[1].Day() != 28 || got[2].Day() != 31 {
		t.Fatalf("expected Jan 31, Feb 28 and Mar 31, got %#v", got)
	}
}

func TestOccurrencesRespectEndDate(t *testing.T) {
	end := time.Date(2026, time.February, 15, 0, 0, 0, 0, time.Local)
	e := Expense{Frequency: Monthly, StartDate: time.Date(2026, time.January, 15, 0, 0, 0, 0, time.Local), EndDate: &end, Status: Active}
	got := occurrences(e, time.Date(2026, time.January, 1, 0, 0, 0, 0, time.Local), time.Date(2026, time.April, 1, 0, 0, 0, 0, time.Local))
	if len(got) != 2 {
		t.Fatalf("expected 2 occurrences, got %d", len(got))
	}
}
