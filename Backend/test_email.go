package main

import (
	"fmt"
	"log"
	"os"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	from := mail.NewEmail("EventStream Auth", os.Getenv("SENDGRID_FROM_EMAIL"))
	subject := "Reset your EventStream Password"
	to := mail.NewEmail("User", "test@example.com") // I will change this to what the user provides or a test email. Actually I don't know the user's email.
	plainTextContent := "Test email"
	htmlContent := "Test email"
	message := mail.NewSingleEmail(from, subject, to, plainTextContent, htmlContent)
	client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
	
	response, err := client.Send(message)
	if err != nil {
		log.Printf("Failed: %v", err)
	} else {
		fmt.Printf("Status: %d, Body: %s\n", response.StatusCode, response.Body)
	}
}
