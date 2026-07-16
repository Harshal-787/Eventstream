package repository

import (
	"database/sql"
)

type SearchRepository struct {
	db *sql.DB
}

func NewSearchRepository(db *sql.DB) *SearchRepository {
	return &SearchRepository{db: db}
}

type SearchResult struct {
	Type        string `json:"type"`
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (r *SearchRepository) GlobalSearch(orgID int, query string) ([]SearchResult, error) {
	var results []SearchResult

	// Normalize query for websearch_to_tsquery
	// E.g., 'sensor' -> 'sensor'
	searchQuery := `
		SELECT 'building' as type, id, name, address as description
		FROM buildings
		WHERE organization_id = $1 AND search_vector @@ websearch_to_tsquery('english', $2)
		UNION ALL
		SELECT 'device' as type, id, name, type || ' ' || COALESCE(hardware_id, '') as description
		FROM devices
		WHERE organization_id = $1 AND search_vector @@ websearch_to_tsquery('english', $2)
		UNION ALL
		SELECT 'user' as type, id, name, email as description
		FROM users
		WHERE organization_id = $1 AND search_vector @@ websearch_to_tsquery('english', $2)
		LIMIT 20
	`

	rows, err := r.db.Query(searchQuery, orgID, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var res SearchResult
		if err := rows.Scan(&res.Type, &res.ID, &res.Name, &res.Description); err != nil {
			return nil, err
		}
		results = append(results, res)
	}

	return results, nil
}
