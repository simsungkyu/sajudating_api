//go:build migration
// +build migration

package extdao

import (
	"log"
	"testing"

	"sajudating_api/api/config"
	"sajudating_api/api/dao"
	"sajudating_api/api/utils"
)

func init() {
	// Initialize configuration and database connection
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := dao.InitDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
}

// TestMigrateSajuProfileImages migrates SajuProfile images from MongoDB to S3
// This test should be run manually when needed: go test -v -tags migration -run TestMigrateSajuProfileImages
func TestMigrateSajuProfileImages(t *testing.T) {
	imageS3Dao := NewImageS3Dao()
	sajuProfileRepo := dao.NewSajuProfileRepository()

	batchSize := 10
	offset := 0
	totalProcessed := 0
	totalMigrated := 0
	totalSkipped := 0
	totalErrors := 0

	log.Println("=== Starting SajuProfile Image Migration ===")

	for {
		// Fetch profiles in batches
		profiles, total, err := sajuProfileRepo.FindWithPagination(batchSize, offset, nil, nil)
		if err != nil {
			t.Fatalf("Failed to fetch saju profiles: %v", err)
		}

		if len(profiles) == 0 {
			log.Printf("No more profiles to process. Total: %d", total)
			break
		}

		log.Printf("Processing batch: offset=%d, count=%d, total=%d", offset, len(profiles), total)

		// Process each profile
		for _, profile := range profiles {
			totalProcessed++

			// Check if ImageData exists
			if len(profile.ImageData) == 0 {
				log.Printf("[%d/%d] Profile %s: No ImageData, skipping", totalProcessed, total, profile.Uid)
				totalSkipped++
				continue
			}

			// Generate S3 path
			imagePath := utils.GetSajuProfileImagePath(profile.Uid)

			// Check if file already exists in S3
			exists, err := imageS3Dao.IsExistImageInS3(imagePath)
			if err != nil {
				log.Printf("[%d/%d] Profile %s: Error checking S3 existence: %v", totalProcessed, total, profile.Uid, err)
				totalErrors++
				continue
			}

			if exists {
				log.Printf("[%d/%d] Profile %s: Image already exists in S3, skipping", totalProcessed, total, profile.Uid)
				totalSkipped++
				continue
			}

			// Save to S3
			err = imageS3Dao.SaveImageToS3(imagePath, profile.ImageData)
			if err != nil {
				log.Printf("[%d/%d] Profile %s: Error saving to S3: %v", totalProcessed, total, profile.Uid, err)
				totalErrors++
				continue
			}

			log.Printf("[%d/%d] Profile %s: Successfully migrated image to S3 (%d bytes)", totalProcessed, total, profile.Uid, len(profile.ImageData))
			totalMigrated++
		}

		// Move to next batch
		offset += batchSize

		// Break if we've processed all records
		if offset >= int(total) {
			break
		}
	}

	log.Println("=== SajuProfile Image Migration Complete ===")
	log.Printf("Total Processed: %d", totalProcessed)
	log.Printf("Total Migrated: %d", totalMigrated)
	log.Printf("Total Skipped: %d", totalSkipped)
	log.Printf("Total Errors: %d", totalErrors)
}

// TestMigratePhyIdealPartnerImages migrates PhyIdealPartner images from MongoDB to S3
// This test should be run manually when needed: go test -v -tags migration -run TestMigratePhyIdealPartnerImages
func TestMigratePhyIdealPartnerImages(t *testing.T) {
	imageS3Dao := NewImageS3Dao()
	phyPartnerRepo := dao.NewPhyIdealPartnerRepository()

	batchSize := 10
	offset := 0
	totalProcessed := 0
	totalMigrated := 0
	totalSkipped := 0
	totalErrors := 0

	log.Println("=== Starting PhyIdealPartner Image Migration ===")

	for {
		// Fetch partners in batches
		partners, total, err := phyPartnerRepo.FindWithPagination(batchSize, offset, nil)
		if err != nil {
			t.Fatalf("Failed to fetch phy ideal partners: %v", err)
		}

		if len(partners) == 0 {
			log.Printf("No more partners to process. Total: %d", total)
			break
		}

		log.Printf("Processing batch: offset=%d, count=%d, total=%d", offset, len(partners), total)

		// Process each partner
		for _, partner := range partners {
			totalProcessed++

			// Check if ImageData exists
			if len(partner.ImageData) == 0 {
				log.Printf("[%d/%d] Partner %s: No ImageData, skipping", totalProcessed, total, partner.Uid)
				totalSkipped++
				continue
			}

			// Generate S3 path
			imagePath := utils.GetPhyPartnerImagePath(partner.Uid)

			// Check if file already exists in S3
			exists, err := imageS3Dao.IsExistImageInS3(imagePath)
			if err != nil {
				log.Printf("[%d/%d] Partner %s: Error checking S3 existence: %v", totalProcessed, total, partner.Uid, err)
				totalErrors++
				continue
			}

			if exists {
				log.Printf("[%d/%d] Partner %s: Image already exists in S3, skipping", totalProcessed, total, partner.Uid)
				totalSkipped++
				continue
			}

			// Save to S3
			err = imageS3Dao.SaveImageToS3(imagePath, partner.ImageData)
			if err != nil {
				log.Printf("[%d/%d] Partner %s: Error saving to S3: %v", totalProcessed, total, partner.Uid, err)
				totalErrors++
				continue
			}

			log.Printf("[%d/%d] Partner %s: Successfully migrated image to S3 (%d bytes)", totalProcessed, total, partner.Uid, len(partner.ImageData))
			totalMigrated++
		}

		// Move to next batch
		offset += batchSize

		// Break if we've processed all records
		if offset >= int(total) {
			break
		}
	}

	log.Println("=== PhyIdealPartner Image Migration Complete ===")
	log.Printf("Total Processed: %d", totalProcessed)
	log.Printf("Total Migrated: %d", totalMigrated)
	log.Printf("Total Skipped: %d", totalSkipped)
	log.Printf("Total Errors: %d", totalErrors)
}

// TestMigrateAllImages runs both migrations sequentially
// This test should be run manually when needed: go test -v -tags migration -run TestMigrateAllImages
func TestMigrateAllImages(t *testing.T) {
	log.Println("=== Starting Complete Image Migration ===")
	log.Println("")

	// Run SajuProfile migration
	t.Run("SajuProfile", func(t *testing.T) {
		// Remove the skip from TestMigrateSajuProfileImages temporarily
		imageS3Dao := NewImageS3Dao()
		sajuProfileRepo := dao.NewSajuProfileRepository()

		batchSize := 10
		offset := 0
		totalProcessed := 0
		totalMigrated := 0
		totalSkipped := 0
		totalErrors := 0

		log.Println("=== Starting SajuProfile Image Migration ===")

		for {
			profiles, total, err := sajuProfileRepo.FindWithPagination(batchSize, offset, nil, nil)
			if err != nil {
				t.Fatalf("Failed to fetch saju profiles: %v", err)
			}

			if len(profiles) == 0 {
				break
			}

			log.Printf("Processing batch: offset=%d, count=%d, total=%d", offset, len(profiles), total)

			for _, profile := range profiles {
				totalProcessed++

				if len(profile.ImageData) == 0 {
					totalSkipped++
					continue
				}

				imagePath := utils.GetSajuProfileImagePath(profile.Uid)

				exists, err := imageS3Dao.IsExistImageInS3(imagePath)
				if err != nil {
					log.Printf("[%d/%d] Profile %s: Error checking S3: %v", totalProcessed, total, profile.Uid, err)
					totalErrors++
					continue
				}

				if exists {
					totalSkipped++
					continue
				}

				err = imageS3Dao.SaveImageToS3(imagePath, profile.ImageData)
				if err != nil {
					log.Printf("[%d/%d] Profile %s: Error saving to S3: %v", totalProcessed, total, profile.Uid, err)
					totalErrors++
					continue
				}

				log.Printf("[%d/%d] Profile %s: Migrated (%d bytes)", totalProcessed, total, profile.Uid, len(profile.ImageData))
				totalMigrated++
			}

			offset += batchSize
			if offset >= int(total) {
				break
			}
		}

		log.Println("=== SajuProfile Migration Complete ===")
		log.Printf("Processed: %d, Migrated: %d, Skipped: %d, Errors: %d", totalProcessed, totalMigrated, totalSkipped, totalErrors)
	})

	log.Println("")

	// Run PhyIdealPartner migration
	t.Run("PhyIdealPartner", func(t *testing.T) {
		imageS3Dao := NewImageS3Dao()
		phyPartnerRepo := dao.NewPhyIdealPartnerRepository()

		batchSize := 10
		offset := 0
		totalProcessed := 0
		totalMigrated := 0
		totalSkipped := 0
		totalErrors := 0

		log.Println("=== Starting PhyIdealPartner Image Migration ===")

		for {
			partners, total, err := phyPartnerRepo.FindWithPagination(batchSize, offset, nil)
			if err != nil {
				t.Fatalf("Failed to fetch phy partners: %v", err)
			}

			if len(partners) == 0 {
				break
			}

			log.Printf("Processing batch: offset=%d, count=%d, total=%d", offset, len(partners), total)

			for _, partner := range partners {
				totalProcessed++

				if len(partner.ImageData) == 0 {
					totalSkipped++
					continue
				}

				imagePath := utils.GetPhyPartnerImagePath(partner.Uid)

				exists, err := imageS3Dao.IsExistImageInS3(imagePath)
				if err != nil {
					log.Printf("[%d/%d] Partner %s: Error checking S3: %v", totalProcessed, total, partner.Uid, err)
					totalErrors++
					continue
				}

				if exists {
					totalSkipped++
					continue
				}

				err = imageS3Dao.SaveImageToS3(imagePath, partner.ImageData)
				if err != nil {
					log.Printf("[%d/%d] Partner %s: Error saving to S3: %v", totalProcessed, total, partner.Uid, err)
					totalErrors++
					continue
				}

				log.Printf("[%d/%d] Partner %s: Migrated (%d bytes)", totalProcessed, total, partner.Uid, len(partner.ImageData))
				totalMigrated++
			}

			offset += batchSize
			if offset >= int(total) {
				break
			}
		}

		log.Println("=== PhyIdealPartner Migration Complete ===")
		log.Printf("Processed: %d, Migrated: %d, Skipped: %d, Errors: %d", totalProcessed, totalMigrated, totalSkipped, totalErrors)
	})

	log.Println("")
	log.Println("=== Complete Image Migration Finished ===")
}
