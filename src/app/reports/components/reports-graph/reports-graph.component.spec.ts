import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReportsGraphComponent } from './reports-graph.component';

describe('ReportsGraphComponent', () => {
  let component: ReportsGraphComponent;
  let fixture: ComponentFixture<ReportsGraphComponent>;
  CommonTestingModule.setUpTestBed(ReportsGraphComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportsGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
