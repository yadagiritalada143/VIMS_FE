import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { FavoritesReportComponent } from './favorites-report.component';

describe('FavoritesReportComponent', () => {
  let component: FavoritesReportComponent;
  let fixture: ComponentFixture<FavoritesReportComponent>;
  CommonTestingModule.setUpTestBed(FavoritesReportComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FavoritesReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FavoritesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
