import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DistributionReleaseComponent } from './distribution-release.component';

describe('DistributionReleaseComponent', () => {
  let component: DistributionReleaseComponent;
  let fixture: ComponentFixture<DistributionReleaseComponent>;
  CommonTestingModule.setUpTestBed(DistributionReleaseComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DistributionReleaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DistributionReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
