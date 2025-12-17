package extdao

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"sajudating_api/api/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// 이미지 처리를 위한 S3 연동
// GetImageFromS3(path string) ([]byte, error, int)
// SaveImageToS3(path string, imageData []byte) (error, int)
// IsExistImageInS3(path string) (bool, error, int)
// GenUploadUrl(path string) (string, error, int)

type ImageS3Dao struct {
	s3Client *s3.Client
	bucket   string
}

func NewImageS3Dao() *ImageS3Dao {
	cfg := config.AppConfig.S3

	awsCfg, err := awsConfig.LoadDefaultConfig(context.Background(),
		awsConfig.WithRegion(cfg.Region),
		awsConfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				cfg.AccessKey,
				cfg.SecretKey,
				"",
			),
		),
	)
	if err != nil {
		panic(fmt.Sprintf("Failed to load AWS config: %v", err))
	}

	client := s3.NewFromConfig(awsCfg)

	return &ImageS3Dao{
		s3Client: client,
		bucket:   cfg.Bucket,
	}
}

// GetImageFromS3 retrieves an image from S3 by path
func (dao *ImageS3Dao) GetImageFromS3(path string) ([]byte, error, int) {
	ctx := context.Background()

	result, err := dao.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(dao.bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		var notFound *types.NotFound
		if errors.As(err, &notFound) {
			return nil, err, 404
		}
		var noSuchKey *types.NoSuchKey
		if errors.As(err, &noSuchKey) {
			return nil, err, 404
		}
		return nil, err, 500
	}
	defer result.Body.Close()

	data, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read object body: %w", err), 500
	}

	return data, nil, 200
}

// SaveImageToS3 saves image data to S3 at the specified path
func (dao *ImageS3Dao) SaveImageToS3(path string, imageData []byte) (error, int) {
	ctx := context.Background()

	_, err := dao.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(dao.bucket),
		Key:    aws.String(path),
		Body:   bytes.NewReader(imageData),
	})
	if err != nil {
		return fmt.Errorf("failed to upload object to S3: %w", err), 500
	}

	return nil, 200
}

// IsExistImageInS3 checks if an image exists in S3 at the specified path
func (dao *ImageS3Dao) IsExistImageInS3(path string) (bool, error, int) {
	ctx := context.Background()

	_, err := dao.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(dao.bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		// Check if error is NotFound
		var notFound *types.NotFound
		if ok := errors.As(err, &notFound); ok {
			return false, nil, 404
		}
		var noSuchKey *types.NoSuchKey
		if ok := errors.As(err, &noSuchKey); ok {
			return false, nil, 404
		}
		return false, fmt.Errorf("failed to check object existence: %w", err), 500
	}

	return true, nil, 200
}

// GenUploadUrl generates a presigned URL for uploading an image to S3
func (dao *ImageS3Dao) GenUploadUrl(path string) (string, error, int) {
	ctx := context.Background()

	presignClient := s3.NewPresignClient(dao.s3Client)

	presignedReq, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(dao.bucket),
		Key:    aws.String(path),
	}, s3.WithPresignExpires(15*time.Minute))

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err), 500
	}

	return presignedReq.URL, nil, 200
}
