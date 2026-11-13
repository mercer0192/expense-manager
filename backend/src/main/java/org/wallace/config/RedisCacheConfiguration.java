package org.wallace.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.SerializationException;

import java.math.BigDecimal;

@Configuration
@EnableCaching
public class RedisCacheConfiguration implements CachingConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(RedisCacheConfiguration.class);

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        Jackson2JsonRedisSerializer<BigDecimal> valueSerializer =
                new Jackson2JsonRedisSerializer<>(BigDecimal.class);
        org.springframework.data.redis.cache.RedisCacheConfiguration cacheConfiguration =
                org.springframework.data.redis.cache.RedisCacheConfiguration.defaultCacheConfig()
                        .serializeValuesWith(
                                RedisSerializationContext.SerializationPair.fromSerializer(valueSerializer));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfiguration)
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                handleRedisError("read", exception, cache, key);
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                handleRedisError("write", exception, cache, key);
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                handleRedisError("evict", exception, cache, key);
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                handleRedisError("clear", exception, cache, "all keys");
            }
        };
    }

    private void handleRedisError(String operation, RuntimeException exception, Cache cache, Object key) {
        if (isRecoverableCacheFailure(exception)) {
            logger.warn("Redis cache {} failed for '{}' and key '{}'; continuing without the cached value.",
                    operation, cache.getName(), key, exception);
            return;
        }

        throw exception;
    }

    private boolean isRecoverableCacheFailure(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof RedisConnectionFailureException
                    || current instanceof SerializationException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
