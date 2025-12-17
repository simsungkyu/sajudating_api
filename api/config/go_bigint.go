package config

import (
	"encoding/json"
	"fmt"
	"io"
	"strconv"

	"github.com/99designs/gqlgen/graphql"
)

// MarshalBigInt is a custom marshaller for BigInt
func MarshalBigInt(i int64) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		io.WriteString(w, strconv.FormatInt(i, 10))
	})
}

// UnmarshalBigInt is a custom unmarshaller for BigInt
func UnmarshalBigInt(v interface{}) (int64, error) {
	switch v := v.(type) {
	case string:
		return strconv.ParseInt(v, 10, 64)
	case int:
		return int64(v), nil
	case int64:
		return v, nil
	case json.Number:
		n, err := v.Int64()
		if err != nil {
			return 0, fmt.Errorf("Parsing error to int64 from json.number")
		}
		return n, nil
	default:
		return 0, fmt.Errorf("BigInt must be a string or an integer")
	}
}
