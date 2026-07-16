package workers

import (
	"encoding/json"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"
	"log"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type MQTTWorker struct {
	client        mqtt.Client
	ingestService *services.TelemetryIngestService
	deviceRepo    *repository.DeviceRepo
}

func NewMQTTWorker(brokerURI, clientID string, ingestService *services.TelemetryIngestService, deviceRepo *repository.DeviceRepo) *MQTTWorker {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(brokerURI)
	opts.SetClientID(clientID)

	client := mqtt.NewClient(opts)

	return &MQTTWorker{
		client:        client,
		ingestService: ingestService,
		deviceRepo:    deviceRepo,
	}
}

func (w *MQTTWorker) Start() {
	if token := w.client.Connect(); token.Wait() && token.Error() != nil {
		log.Printf("MQTT Worker failed to connect: %v", token.Error())
		return
	}

	topic := "events/telemetry/#"
	if token := w.client.Subscribe(topic, 0, w.messageHandler); token.Wait() && token.Error() != nil {
		log.Printf("MQTT Worker failed to subscribe: %v", token.Error())
		return
	}

	log.Printf("MQTT Worker started and subscribed to %s", topic)
}

func (w *MQTTWorker) Stop() {
	w.client.Disconnect(250)
}

func (w *MQTTWorker) messageHandler(client mqtt.Client, msg mqtt.Message) {
	var payload map[string]interface{}
	if err := json.Unmarshal(msg.Payload(), &payload); err != nil {
		log.Printf("MQTT Worker invalid payload: %v", err)
		return
	}

	hardwareID, ok := payload["hardware_id"].(string)
	if !ok {
		return
	}

	// This assumes the worker might not know the organization ID if it's purely external,
	// but if devices are globally uniquely identifiable via hardware_id, we can find the org.
	device, err := w.deviceRepo.GetDeviceByHardwareID(hardwareID)
	if err != nil || device == nil {
		return
	}

	tel := &models.Telemetry{
		OrganizationID: device.OrganizationID,
		DeviceID:       device.ID,
		Timestamp:      time.Now(),
		Payload:        payload,
	}

	_ = w.ingestService.Ingest(tel)
}
