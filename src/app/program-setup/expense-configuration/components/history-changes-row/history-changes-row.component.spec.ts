import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { HistoryChangesRowComponent } from './history-changes-row.component';

describe('HistoryChangesRowComponent', () => {
  let component: HistoryChangesRowComponent;
  let fixture: ComponentFixture<HistoryChangesRowComponent>;
  CommonTestingModule.setUpTestBed(HistoryChangesRowComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HistoryChangesRowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryChangesRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
