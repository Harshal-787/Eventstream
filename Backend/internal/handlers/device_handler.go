package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"

	"github.com/gin-gonic/gin"
)

type DeviceHandler struct {
	Repo   *repository.DeviceRepo
	logger *services.AuditLogger
}

func NewDeviceHandler(repo *repository.DeviceRepo, logger *services.AuditLogger) *DeviceHandler {
	return &DeviceHandler{Repo: repo, logger: logger}
}

// --- Models ---
func (h *DeviceHandler) GetModels(c *gin.Context) {
	modelsList, err := h.Repo.GetModels()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device models"})
		return
	}
	c.JSON(http.StatusOK, modelsList)
}

// --- Floors and Rooms ---
func (h *DeviceHandler) GetFloors(c *gin.Context) {
	bIdStr := c.Param("id")
	bId, err := strconv.Atoi(bIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid building ID"})
		return
	}
	floors, err := h.Repo.GetFloorsByBuilding(bId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch floors"})
		return
	}
	c.JSON(http.StatusOK, floors)
}

func (h *DeviceHandler) CreateFloor(c *gin.Context) {
	bIdStr := c.Param("id")
	bId, err := strconv.Atoi(bIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid building ID"})
		return
	}

	var floor models.Floor
	if err := c.ShouldBindJSON(&floor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	floor.BuildingID = bId

	if err := h.Repo.CreateFloor(&floor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create floor"})
		return
	}
	c.JSON(http.StatusCreated, floor)
}

func (h *DeviceHandler) UpdateFloor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid floor ID"})
		return
	}

	var req struct {
		Name  string `json:"name"`
		Level int    `json:"level"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Repo.UpdateFloor(id, req.Name, req.Level); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update floor"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Floor updated"})
}

func (h *DeviceHandler) DeleteFloor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid floor ID"})
		return
	}

	if err := h.Repo.DeleteFloor(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete floor"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Floor deleted"})
}

func (h *DeviceHandler) GetRooms(c *gin.Context) {
	fIdStr := c.Param("id")
	fId, err := strconv.Atoi(fIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid floor ID"})
		return
	}
	rooms, err := h.Repo.GetRoomsByFloor(fId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}
	c.JSON(http.StatusOK, rooms)
}

func (h *DeviceHandler) CreateRoom(c *gin.Context) {
	fIdStr := c.Param("id")
	fId, err := strconv.Atoi(fIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid floor ID"})
		return
	}

	var room models.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	room.FloorID = fId

	if err := h.Repo.CreateRoom(&room); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}
	c.JSON(http.StatusCreated, room)
}

func (h *DeviceHandler) UpdateRoom(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Repo.UpdateRoom(id, req.Name, req.Type); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Room updated"})
}

func (h *DeviceHandler) DeleteRoom(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	if err := h.Repo.DeleteRoom(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete room"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Room deleted"})
}

// --- Devices ---
func (h *DeviceHandler) ListDevices(c *gin.Context) {
	status := c.Query("status")
	bIdStr := c.Query("building_id")
	var bId *int
	if bIdStr != "" {
		id, err := strconv.Atoi(bIdStr)
		if err == nil {
			bId = &id
		}
	}

	var ownerID *int
	role, exists := c.Get("user_role")
	uid, uidExists := c.Get("user_id")
	
	if exists && role == "user" {
		if uidExists {
			if id, ok := uid.(int); ok {
				ownerID = &id
			} else if id, ok := uid.(float64); ok {
				intId := int(id)
				ownerID = &intId
			}
		}
	}
	
	log.Printf("DEBUG ListDevices: role=%v (exists: %v), uid=%v (exists: %v), ownerID=%v", role, exists, uid, uidExists, ownerID)

	devices, err := h.Repo.GetDevices(bId, status, ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch devices"})
		return
	}
	c.JSON(http.StatusOK, devices)
}

func (h *DeviceHandler) CreateDevice(c *gin.Context) {
	var req struct {
		HardwareID string `json:"hardware_id"`
		Name       string `json:"name"`
		Type       string `json:"type"`
		ModelID    int    `json:"model_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dev := models.Device{
		HardwareID: &req.HardwareID,
		Name:       req.Name,
		Type:       req.Type,
		ModelID:    &req.ModelID,
		Status:     "unassigned",
	}

	if err := h.Repo.CreateDevice(&dev); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create device"})
		return
	}

	userID := c.GetInt("user_id")
	entityType := "device"
	h.logger.Log(&userID, "DEVICE_CREATED", &entityType, &dev.ID, dev, c.ClientIP())

	c.JSON(http.StatusCreated, dev)
}

func (h *DeviceHandler) DeleteDevice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	if err := h.Repo.DeleteDevice(id); err != nil {
		log.Printf("Failed to delete device: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete device: " + err.Error()})
		return
	}

	userID := c.GetInt("user_id")
	entityType := "device"
	h.logger.Log(&userID, "DEVICE_DELETED", &entityType, &id, map[string]interface{}{}, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Device deleted"})
}

func (h *DeviceHandler) UpdateDeviceStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Repo.UpdateDeviceStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update device status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device status updated successfully"})
}

func (h *DeviceHandler) CreateModel(c *gin.Context) {
	var model models.DeviceModel
	if err := c.ShouldBindJSON(&model); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Repo.CreateModel(&model); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create device model"})
		return
	}

	c.JSON(http.StatusCreated, model)
}

func (h *DeviceHandler) BulkCreateDevices(c *gin.Context) {
	// For CSV upload or bulk array JSON
	var devices []struct {
		HardwareID string `json:"hardware_id"`
		Name       string `json:"name"`
		Type       string `json:"type"`
		ModelID    int    `json:"model_id"`
	}
	if err := c.ShouldBindJSON(&devices); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, req := range devices {
		dev := models.Device{
			HardwareID: &req.HardwareID,
			Name:       req.Name,
			Type:       req.Type,
			ModelID:    &req.ModelID,
			Status:     "unassigned",
		}
		// Ignore individual errors in bulk for MVP, or return partial success
		h.Repo.CreateDevice(&dev)
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Bulk import completed"})
}

func (h *DeviceHandler) AssignDevice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	var req struct {
		BuildingID *int   `json:"building_id"`
		FloorID    *int   `json:"floor_id"`
		RoomID     *int   `json:"room_id"`
		Status     string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch existing device first (In real world we'd have a GetDeviceById)
	// For MVP, just updating all fields we allow to update. We'll need a GetDevice in repo.
	
	// Quick hack: just use an UPDATE query in repo or we write a GetDevice.
	// Actually I will quickly add a GetDeviceById in Repo or just write an ad-hoc query here since we are fast-tracking.
	var dev models.Device
	query := `SELECT hardware_id, name, type, model_id, metadata, battery_pct, signal_strength FROM devices WHERE id = $1`
	err = h.Repo.DB.QueryRow(query, id).Scan(&dev.HardwareID, &dev.Name, &dev.Type, &dev.ModelID, &dev.Metadata, &dev.BatteryPct, &dev.SignalStrength)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device"})
		return
	}

	dev.ID = id
	dev.BuildingID = req.BuildingID
	dev.FloorID = req.FloorID
	dev.RoomID = req.RoomID
	if req.Status != "" {
		dev.Status = req.Status
	} else {
		dev.Status = "active" // Default on assignment
	}

	if err := h.Repo.UpdateDevice(&dev); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update device"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device assigned successfully"})
}

// --- Sensor Requests ---
func (h *DeviceHandler) CreateSensorRequest(c *gin.Context) {
	uid, exists := c.Get("user_id") // from auth middleware
	
	var req models.SensorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if exists {
		if id, ok := uid.(int); ok {
			req.UserID = id
		} else if id, ok := uid.(float64); ok {
			req.UserID = int(id)
		}
	}
	req.Status = "pending"

	if err := h.Repo.CreateSensorRequest(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *DeviceHandler) ListSensorRequests(c *gin.Context) {
	bIdStr := c.Query("building_id")
	var bId *int
	if bIdStr != "" {
		id, err := strconv.Atoi(bIdStr)
		if err == nil {
			bId = &id
		}
	}

	reqs, err := h.Repo.GetSensorRequests(bId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list requests"})
		return
	}
	c.JSON(http.StatusOK, reqs)
}

func (h *DeviceHandler) FulfillSensorRequest(c *gin.Context) {
	reqID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}
	rawUserID, exists := c.Get("user_id") // Admin ID

	var sr models.SensorRequest
	err = h.Repo.DB.QueryRow(`SELECT building_id, floor_id, room_id, sensor_type, brand, model_name, hardware_id FROM sensor_requests WHERE id = $1`, reqID).
		Scan(&sr.BuildingID, &sr.FloorID, &sr.RoomID, &sr.SensorType, &sr.Brand, &sr.ModelName, &sr.HardwareID)
	if err != nil {
		log.Printf("Failed to fetch request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch request: " + err.Error()})
		return
	}

	var reqBody struct {
		AssignedDeviceID *int `json:"assigned_device_id"`
		AutoProvision    bool `json:"auto_provision"`
	}
	// Try to bind JSON, but ignore errors if it's empty (for backwards compatibility)
	c.ShouldBindJSON(&reqBody)

	var devID int

	if reqBody.AutoProvision {
		// One-Click Provisioning: Generate virtual hardware ID and register
		var modelID *int
		var mID int
		err = h.Repo.DB.QueryRow(`SELECT id FROM device_models WHERE brand=$1 AND model_name=$2`, sr.Brand, sr.ModelName).Scan(&mID)
		if err == nil {
			modelID = &mID
		} else {
			err = h.Repo.DB.QueryRow(`INSERT INTO device_models (brand, model_name, sensor_type) VALUES ($1, $2, $3) RETURNING id`, sr.Brand, sr.ModelName, sr.SensorType).Scan(&mID)
			if err == nil {
				modelID = &mID
			}
		}

		newHardwareID := "VIRT-" + strconv.FormatInt(time.Now().UnixMilli(), 10)
		dev := models.Device{
			HardwareID: &newHardwareID,
			Name:       sr.Brand + " " + sr.ModelName,
			Type:       sr.SensorType,
			ModelID:    modelID,
			BuildingID: &sr.BuildingID,
			FloorID:    &sr.FloorID,
			RoomID:     &sr.RoomID,
			Status:     "active",
		}
		if err := h.Repo.CreateDevice(&dev); err != nil {
			log.Printf("Failed to auto-provision device: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to auto-provision device: " + err.Error()})
			return
		}
	} else if reqBody.AssignedDeviceID != nil {
		// Manual fulfillment: use the provided device ID
		devID = *reqBody.AssignedDeviceID
		
		// Update existing device
		_, err = h.Repo.DB.Exec(`UPDATE devices SET building_id=$1, floor_id=$2, room_id=$3, status='active' WHERE id=$4`, 
			sr.BuildingID, sr.FloorID, sr.RoomID, devID)
		if err != nil {
			log.Printf("Failed to assign device: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign device: " + err.Error()})
			return
		}
	} else {
		// Automatic fulfillment (requires HardwareID)
		if sr.HardwareID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "This request has no hardware ID. You must manually assign a device from inventory."})
			return
		}

		var modelID *int
		var mID int
		err = h.Repo.DB.QueryRow(`SELECT id FROM device_models WHERE brand=$1 AND model_name=$2`, sr.Brand, sr.ModelName).Scan(&mID)
		if err == nil {
			modelID = &mID
		} else {
			err = h.Repo.DB.QueryRow(`INSERT INTO device_models (brand, model_name, sensor_type) VALUES ($1, $2, $3) RETURNING id`, sr.Brand, sr.ModelName, sr.SensorType).Scan(&mID)
			if err == nil {
				modelID = &mID
			}
		}

		err = h.Repo.DB.QueryRow(`SELECT id FROM devices WHERE hardware_id=$1`, sr.HardwareID).Scan(&devID)
		if err == sql.ErrNoRows {
			dev := models.Device{
				HardwareID: &sr.HardwareID,
				Name:       sr.Brand + " " + sr.ModelName,
				Type:       sr.SensorType,
				ModelID:    modelID,
				BuildingID: &sr.BuildingID,
				FloorID:    &sr.FloorID,
				RoomID:     &sr.RoomID,
				Status:     "active",
			}
			if err := h.Repo.CreateDevice(&dev); err != nil {
				log.Printf("Failed to register device: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register device: " + err.Error()})
				return
			}
		} else if err != nil {
			log.Printf("Failed to query device: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query device: " + err.Error()})
			return
		} else {
			_, err = h.Repo.DB.Exec(`UPDATE devices SET building_id=$1, floor_id=$2, room_id=$3, status='active' WHERE id=$4`, 
				sr.BuildingID, sr.FloorID, sr.RoomID, devID)
			if err != nil {
				log.Printf("Failed to update existing device: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update existing device: " + err.Error()})
				return
			}
		}
	}

	var uid int
	if exists {
		if id, ok := rawUserID.(int); ok {
			uid = id
		} else if id, ok := rawUserID.(float64); ok {
			uid = int(id)
		}
	}

	if err := h.Repo.UpdateSensorRequestStatus(reqID, "fulfilled", &uid); err != nil {
		log.Printf("Failed to update request status: %v, uid: %d, reqID: %d", err, uid, reqID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request fulfilled and device registered & assigned"})
}

func (h *DeviceHandler) DeleteSensorRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	if err := h.Repo.DeleteSensorRequest(id); err != nil {
		log.Printf("Failed to delete sensor request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete sensor request: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Sensor request deleted"})
}
