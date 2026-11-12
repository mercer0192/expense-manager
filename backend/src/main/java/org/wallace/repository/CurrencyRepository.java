package org.wallace.repository;

import org.wallace.model.Currency;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CurrencyRepository extends JpaRepository<Currency, Long> {
    java.util.Optional<Currency> findByCurrencyCode(String currencyCode);
}
