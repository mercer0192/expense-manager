package org.wallace.scheduling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.wallace.model.Currency;
import org.wallace.repository.CurrencyRepository;
import org.wallace.service.CurrencyRateCacheService;

@Component
public class CurrencyRateRefreshJob {

    private final CurrencyRepository currencyRepository;
    private final CurrencyRateCacheService currencyRateCacheService;

    public CurrencyRateRefreshJob(CurrencyRepository currencyRepository,
                                  CurrencyRateCacheService currencyRateCacheService) {
        this.currencyRepository = currencyRepository;
        this.currencyRateCacheService = currencyRateCacheService;
    }

    @Scheduled(
            cron = "${expense.currency.cache-refresh-cron:0 0 12 * * *}",
            zone = "${expense.currency.cache-refresh-zone:Asia/Kuala_Lumpur}")
    public void refreshCurrencyRates() {
        for (Currency currency : currencyRepository.findAll()) {
            currencyRateCacheService.cacheRate(
                    currency.getCurrencyCode(), currency.getRateToBase());
        }
    }
}
