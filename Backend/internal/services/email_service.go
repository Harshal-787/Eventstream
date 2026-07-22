package services

import (
	"fmt"
	"log"

	"eventstream/internal/config"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

func (s *EmailService) SendOTP(toEmail string, otpCode string) error {
	from := mail.NewEmail("EventStream Auth", s.cfg.SendGridFrom)
	subject := "Your EventStream Login Code"
	to := mail.NewEmail("User", toEmail)
	plainTextContent := fmt.Sprintf("Your login code is: %s. It will expire in 10 minutes.", otpCode)
	htmlContent := fmt.Sprintf("<strong>Your login code is: %s</strong><br>It will expire in 10 minutes.", otpCode)
	message := mail.NewSingleEmail(from, subject, to, plainTextContent, htmlContent)
	client := sendgrid.NewSendClient(s.cfg.SendGridAPIKey)
	
	response, err := client.Send(message)
	if err != nil {
		log.Printf("Failed to send email to %s: %v", toEmail, err)
		return err
	}
	
	if response.StatusCode >= 400 {
		log.Printf("SendGrid API returned error: %d - %s", response.StatusCode, response.Body)
		return fmt.Errorf("failed to send email via SendGrid: %d", response.StatusCode)
	}

	return nil
}

func (s *EmailService) SendPasswordResetEmail(toEmail string, resetLink string) error {
	from := mail.NewEmail("EventStream Auth", s.cfg.SendGridFrom)
	subject := "Reset your EventStream Password"
	to := mail.NewEmail("User", toEmail)
	plainTextContent := fmt.Sprintf("Click the following link to reset your password: %s\n\nThis link will expire in 1 hour.", resetLink)
	htmlContent := fmt.Sprintf("<p>Click the following link to reset your password:</p><p><a href=\"%s\">%s</a></p><p>This link will expire in 1 hour.</p>", resetLink, resetLink)
	message := mail.NewSingleEmail(from, subject, to, plainTextContent, htmlContent)
	client := sendgrid.NewSendClient(s.cfg.SendGridAPIKey)
	
	response, err := client.Send(message)
	if err != nil {
		log.Printf("Failed to send reset email to %s: %v", toEmail, err)
		return err
	}
	
	if response.StatusCode >= 400 {
		log.Printf("SendGrid API returned error for reset email: %d - %s", response.StatusCode, response.Body)
		return fmt.Errorf("failed to send reset email via SendGrid: %d", response.StatusCode)
	}

	return nil
}
