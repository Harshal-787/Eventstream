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
	client          mqtt.Client
	telemetryRepo   *repository.TelemetryRepository
	deviceRepo      *repository.DeviceRepo
	anomalyDetector *services.AnomalyDetector
}

func NewMQTTWorker(brokerURI, clientID string, telemetryRepo *repository.TelemetryRepository, deviceRepo *repository.DeviceRepo, anomalyDetector *services.AnomalyDetector) *MQTTWorker {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(brokerURI)
	opts.SetClientID(clientID)

	client := mqtt.NewClient(opts)

	return &MQTTWorker{
		client:          client,
		telemetryRepo:   telemetryRepo,
		deviceRepo:      deviceRepo,
		anomalyDetector: anomalyDetector,
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

	_ = w.telemetryRepo.Insert(tel)
	go w.anomalyDetector.Process(tel)
}
