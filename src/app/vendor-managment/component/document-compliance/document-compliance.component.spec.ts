import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DocumentComplianceComponent } from './document-compliance.component';

describe('DocumentComplianceComponent', () => {
  let component: DocumentComplianceComponent;
  let fixture: ComponentFixture<DocumentComplianceComponent>;
  CommonTestingModule.setUpTestBed(DocumentComplianceComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentComplianceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentComplianceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
