package workers

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"
)

type ReportScheduler struct {
	repo         *repository.ReportScheduleRepo
	reportSvc    *services.ReportingService
	emailSvc     *services.EmailService
	healthSvc    *services.HealthService
	ticker       *time.Ticker
	quit         chan struct{}
}

func NewReportScheduler(repo *repository.ReportScheduleRepo, reportSvc *services.ReportingService, emailSvc *services.EmailService, healthSvc *services.HealthService) *ReportScheduler {
	return &ReportScheduler{
		repo:      repo,
		reportSvc: reportSvc,
		emailSvc:  emailSvc,
		healthSvc: healthSvc,
		quit:      make(chan struct{}),
	}
}

func (s *ReportScheduler) Start() {
	log.Println("Starting Report Scheduler worker...")
	// We run it every minute in this implementation so it's easy to test.
	// In production, this might be hourly.
	s.ticker = time.NewTicker(1 * time.Minute)
	
	go func() {
		for {
			select {
			case <-s.ticker.C:
				s.checkSchedules()
				if s.healthSvc != nil {
					s.healthSvc.PingWorker("ReportScheduler")
				}
			case <-s.quit:
				s.ticker.Stop()
				return
			}
		}
	}()
}

func (s *ReportScheduler) Stop() {
	close(s.quit)
}

func (s *ReportScheduler) checkSchedules() {
	schedules, err := s.repo.GetAll()
	if err != nil {
		log.Printf("ReportScheduler failed to get schedules: %v", err)
		return
	}

	now := time.Now()
	for _, sched := range schedules {
		if s.isDue(sched, now) {
			s.runSchedule(sched, now)
		}
	}
}

func (s *ReportScheduler) isDue(sched models.ReportSchedule, now time.Time) bool {
	if sched.LastRunAt == nil {
		return true
	}

	durationSinceLastRun := now.Sub(*sched.LastRunAt)

	switch sched.Frequency {
	case "daily":
		return durationSinceLastRun >= 24*time.Hour
	case "weekly":
		return durationSinceLastRun >= 7*24*time.Hour
	case "monthly":
		// Approximation
		return durationSinceLastRun >= 30*24*time.Hour
	default:
		// Invalid frequency
		return false
	}
}

func (s *ReportScheduler) runSchedule(sched models.ReportSchedule, now time.Time) {
	log.Printf("Running report schedule %d for org %d", sched.ID, sched.OrganizationID)

	var recipients []string
	if err := json.Unmarshal(sched.Recipients, &recipients); err != nil || len(recipients) == 0 {
		log.Printf("ReportScheduler skipped schedule %d due to invalid/empty recipients", sched.ID)
		return
	}

	filters := services.ReportFilters{}
	
	// Set time filter based on frequency
	var start time.Time
	switch sched.Frequency {
	case "daily":
		start = now.Add(-24 * time.Hour)
	case "weekly":
		start = now.Add(-7 * 24 * time.Hour)
	case "monthly":
		start = now.Add(-30 * 24 * time.Hour)
	}
	filters.StartDate = &start
	filters.EndDate = &now

	var data services.ReportData
	var err error

	switch sched.ReportType {
	case "event_statistics":
		data, err = s.reportSvc.GetEventStatistics(sched.OrganizationID, filters)
	case "alert_trends":
		data, err = s.reportSvc.GetAlertTrends(sched.OrganizationID, filters)
	case "device_availability":
		data, err = s.reportSvc.GetDeviceAvailability(sched.OrganizationID, filters)
	case "device_health":
		data, err = s.reportSvc.GetDeviceHealth(sched.OrganizationID, filters)
	case "building_performance":
		data, err = s.reportSvc.GetBuildingPerformance(sched.OrganizationID, filters)
	case "sensor_activity":
		data, err = s.reportSvc.GetSensorActivity(sched.OrganizationID, filters)
	case "user_activity":
		data, err = s.reportSvc.GetUserActivity(sched.OrganizationID, filters)
	case "audit_logs":
		data, err = s.reportSvc.GetAuditLogs(sched.OrganizationID, filters)
	default:
		log.Printf("ReportScheduler unknown report type: %s", sched.ReportType)
		return
	}

	if err != nil {
		log.Printf("ReportScheduler failed to generate data for schedule %d: %v", sched.ID, err)
		return
	}

	var fileBytes []byte
	var ext string

	switch sched.Format {
	case "csv":
		fileBytes, err = services.ExportCSV(data)
		ext = "csv"
	case "pdf":
		fileBytes, err = services.ExportPDF(data)
		ext = "pdf"
	case "excel":
		fileBytes, err = services.ExportExcel(data)
		ext = "xlsx"
	default:
		log.Printf("ReportScheduler invalid format: %s", sched.Format)
		return
	}

	if err != nil {
		log.Printf("ReportScheduler failed to export file for schedule %d: %v", sched.ID, err)
		return
	}

	filename := fmt.Sprintf("%s_%s.%s", sched.ReportType, sched.Frequency, ext)
	subject := fmt.Sprintf("Scheduled Report: %s (%s)", data.Title, sched.Frequency)
	bodyText := fmt.Sprintf("Hello,\n\nPlease find attached your %s report for the %s period.\n\nThank you,\nEventStream", data.Title, sched.Frequency)
	bodyHtml := fmt.Sprintf("<p>Hello,</p><p>Please find attached your <strong>%s</strong> report for the <em>%s</em> period.</p><p>Thank you,<br>EventStream</p>", data.Title, sched.Frequency)

	err = s.emailSvc.SendReportEmailWithAttachment(recipients, subject, bodyText, bodyHtml, filename, fileBytes)
	if err != nil {
		log.Printf("ReportScheduler failed to email schedule %d: %v", sched.ID, err)
		return
	}

	if err := s.repo.UpdateLastRun(sched.ID); err != nil {
		log.Printf("ReportScheduler failed to update last_run_at for schedule %d: %v", sched.ID, err)
	}

	log.Printf("ReportScheduler successfully ran schedule %d", sched.ID)
}
